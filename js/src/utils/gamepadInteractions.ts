import * as rc from "../rive_advanced.mjs";
import {
  GAMEPAD_MAX_AXES,
  GAMEPAD_MAX_BUTTONS,
  GamepadBatchEncoder,
  GamepadChangeKind,
  GamepadMappingKind,
} from "./gamepadBatchEncoder";

// Standard mapping: 17 buttons, 4 stick axes, plus triggers mirrored onto axes 4/5.
const STANDARD_BUTTON_COUNT = 17;
const STANDARD_STICK_AXIS_COUNT = 4;
const LEFT_TRIGGER_BUTTON = 6;
const RIGHT_TRIGGER_BUTTON = 7;
// Consecutive rejected batches before giving up on a state machine.
const MAX_SUBMIT_FAILURES = 3;

interface PadState {
  deviceId: number;
  mapping: GamepadMappingKind;
  buttons: number[];
  axes: number[];
}

interface Slot {
  deviceId: number;
  id: string;
}

function zeros(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(0);
  }
  return out;
}

function restState(pad: PadState): PadState {
  return {
    deviceId: pad.deviceId,
    mapping: pad.mapping,
    buttons: zeros(pad.buttons.length),
    axes: zeros(pad.axes.length),
  };
}

function readNavigatorGamepads(): (Gamepad | null)[] {
  if (typeof navigator === "undefined" || !navigator.getGamepads) {
    return [];
  }
  try {
    return Array.prototype.slice.call(navigator.getGamepads());
  } catch {
    // Permissions-Policy or insecure-origin SecurityError.
    return [];
  }
}

function readButtons(pad: Gamepad, count: number): number[] {
  const buttons: number[] = [];
  for (let i = 0; i < count; i++) {
    buttons.push(pad.buttons[i] ? pad.buttons[i].value : 0);
  }
  return buttons;
}

function toPadState(deviceId: number, pad: Gamepad): PadState {
  if (pad.mapping !== "standard") {
    // Unknown layout: sent as reported, up to the core's caps.
    return {
      deviceId,
      mapping: GamepadMappingKind.Unknown,
      buttons: readButtons(pad, Math.min(pad.buttons.length, GAMEPAD_MAX_BUTTONS)),
      axes: pad.axes.slice(0, GAMEPAD_MAX_AXES),
    };
  }
  const buttons = readButtons(pad, STANDARD_BUTTON_COUNT);
  const axes: number[] = [];
  for (let i = 0; i < STANDARD_STICK_AXIS_COUNT; i++) {
    axes.push(pad.axes[i] ?? 0);
  }
  axes.push(buttons[LEFT_TRIGGER_BUTTON], buttons[RIGHT_TRIGGER_BUTTON]);
  return { deviceId, mapping: GamepadMappingKind.Standard, buttons, axes };
}

/**
 * Page-wide gamepad reader shared by every Rive instance: one `getGamepads()` per frame,
 * device ids allocated once (monotonic from 1, never reused), and a single window listener.
 */
class GamepadSource {
  private subscribers = 0;
  private hasPads = false;
  private nextDeviceId = 1;
  private slots: { [index: number]: Slot } = {};
  private cachedTime = NaN;
  private cached: PadState[] = [];

  public subscribe(): void {
    if (this.subscribers++ > 0 || typeof window === "undefined") {
      return;
    }
    window.addEventListener("gamepadconnected", this.onConnected);
    // The event doesn't re-fire for pads exposed before we started listening.
    this.hasPads = readNavigatorGamepads().some((pad) => !!pad);
  }

  public unsubscribe(): void {
    if (--this.subscribers > 0 || typeof window === "undefined") {
      return;
    }
    window.removeEventListener("gamepadconnected", this.onConnected);
    this.hasPads = false;
    this.cachedTime = NaN;
    this.cached = [];
  }

  /** Current pads; cached per rAF timestamp so instances share one read. */
  public read(time: number): PadState[] {
    if (!this.hasPads) {
      return [];
    }
    if (time === this.cachedTime) {
      return this.cached;
    }
    const pads: PadState[] = [];
    // Rebuilt each read so emptied slots drop out.
    const slots: { [index: number]: Slot } = {};
    const gamepads = readNavigatorGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const pad = gamepads[i];
      if (!pad || !pad.connected) {
        continue;
      }
      const prev = this.slots[pad.index];
      const slot =
        prev && prev.id === pad.id
          ? prev
          : { deviceId: this.nextDeviceId++, id: pad.id };
      slots[pad.index] = slot;
      pads.push(toPadState(slot.deviceId, pad));
    }
    this.slots = slots;
    this.hasPads = pads.length > 0;
    this.cachedTime = time;
    this.cached = pads;
    return pads;
  }

  private onConnected = (): void => {
    this.hasPads = true;
  };
}

const gamepadSource = new GamepadSource();

export interface GamepadInteractionsParams {
  /** Hold button/axis input at rest unless DOM focus is within the canvas/overlay. Pads still connect. */
  requireFocus: boolean;
  isFocusWithin: () => boolean;
}

/**
 * Per-Rive-instance gamepad bridge driving a single state machine. Tracks what that state
 * machine has been sent and submits only the difference, so after a pause it catches up
 * without duplicate connected events.
 */
export class GamepadInteractions {
  private encoder = new GamepadBatchEncoder();
  private stateMachine: rc.StateMachineInstance | undefined;
  // deviceId -> values last sent to `stateMachine`.
  private lastSentPads = new Map<number, PadState>();
  private submitFailures = 0;

  constructor(private params: GamepadInteractionsParams) {
    gamepadSource.subscribe();
  }

  /** Poll, diff and submit one batch. Call once per frame before advancing. */
  public handleGamepadInputs(time: number, stateMachine: rc.StateMachineInstance | undefined): void {
    if (!stateMachine) {
      return;
    }
    if (stateMachine !== this.stateMachine) {
      // A new state machine knows no devices yet; resend connected records.
      this.stateMachine = stateMachine;
      this.lastSentPads.clear();
      this.submitFailures = 0;
    }
    if (this.submitFailures >= MAX_SUBMIT_FAILURES) {
      return;
    }
    let pads = gamepadSource.read(time);
    // Nothing connected and nothing left to disconnect.
    if (pads.length === 0 && this.lastSentPads.size === 0) {
      return;
    }
    if (this.params.requireFocus && !this.params.isFocusWithin()) {
      // Keep devices connected but release everything they hold.
      pads = pads.map(restState);
    }
    this.encoder.begin();
    this.encodeDiff(pads);
    if (this.encoder.isEmpty) {
      return;
    }
    if (stateMachine.submitGamepadsFromBuffer(this.encoder.end())) {
      this.submitFailures = 0;
      return;
    }
    // The core stops at the first bad record, so resend connected records next
    // frame rather than updates for devices it may never have seen.
    this.lastSentPads.clear();
    if (++this.submitFailures >= MAX_SUBMIT_FAILURES) {
      console.error(
        "[Rive] Gamepad input was rejected by the state machine " +
          `${MAX_SUBMIT_FAILURES} times in a row; gamepad input is disabled for it.`,
      );
    }
  }

  public dispose(): void {
    this.stateMachine = undefined;
    this.lastSentPads.clear();
    gamepadSource.unsubscribe();
  }

  /** Writes records that bring `lastSentPads` up to `pads`, updating it as it goes. */
  private encodeDiff(pads: PadState[]): void {
    const present: { [deviceId: number]: boolean } = {};
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      present[pad.deviceId] = true;
      let prev = this.lastSentPads.get(pad.deviceId);
      if (!prev) {
        // Connect at rest so inputs already held fire as updates.
        prev = restState(pad);
        this.encoder.connected(pad.deviceId, pad.mapping, prev.buttons, prev.axes);
        this.lastSentPads.set(pad.deviceId, prev);
      }
      this.encodeChanges(pad.deviceId, GamepadChangeKind.Button, prev.buttons, pad.buttons);
      this.encodeChanges(pad.deviceId, GamepadChangeKind.Axis, prev.axes, pad.axes);
    }
    this.lastSentPads.forEach((_, deviceId) => {
      if (!present[deviceId]) {
        this.encoder.disconnected(deviceId);
        this.lastSentPads.delete(deviceId);
      }
    });
  }

  private encodeChanges(
    deviceId: number,
    kind: GamepadChangeKind,
    prev: number[],
    next: number[],
  ): void {
    for (let i = 0; i < next.length; i++) {
      const value = next[i];
      if (value !== prev[i]) {
        this.encoder.update(deviceId, kind, i, value);
        prev[i] = value;
      }
    }
  }
}
