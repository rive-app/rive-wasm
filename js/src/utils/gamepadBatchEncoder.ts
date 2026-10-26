/** Must match `rive::kGamepadBatchWireVersion` (runtime/include/rive/input/gamepad_batch.hpp). */
export const GAMEPAD_BATCH_VERSION = 2;
export const GAMEPAD_MAX_BUTTONS = 32;
export const GAMEPAD_MAX_AXES = 16;

// Byte sizes of the wire fields/records.
const VERSION_SIZE = 4; // u32
const VALUE_SIZE = 4; // f32 button/axis value
// type(1) + deviceId(4) + mapping(1) + nButtons(1) + nAxes(1) + padding(1); values follow
const CONNECTED_HEADER_SIZE = 9;
// type(1) + deviceId(4) + nChanges(1) + kind(1) + index(1) + value(4)
// Always 12B because we send one change per event, but we could revisit to send larger updates.
const UPDATE_RECORD_SIZE = 12;
// type(1) + deviceId(4)
const DISCONNECTED_RECORD_SIZE = 5;

/** C++ `rive::GamepadRecordType`. */
export enum GamepadRecordType {
  Connected = 0,
  Update = 1,
  Disconnected = 2,
}

/** C++ `rive::GamepadInputChangeKind`. */
export enum GamepadChangeKind {
  Button = 0,
  Axis = 1,
}

/** C++ `rive::GamepadMappingKind`. */
export enum GamepadMappingKind {
  Standard = 0,
  Unknown = 1,
}

/**
 * Builds buffer to send to the state machine for gamepad input connection/updates/disconnect.
 *
 * Each `update` record carries a single change: the core
 * applies and dispatches records in order, so N single-change records in one batch behave like
 * N separate submits.
 *
 * `end()` returns a view into a reused scratch buffer, valid until the next `begin()`.
 */
export class GamepadBatchEncoder {
  private buffer: ArrayBuffer;
  private view: DataView;
  private bytes: Uint8Array;
  private offset = 0;

  constructor(initialCapacity = 256) {
    this.buffer = new ArrayBuffer(initialCapacity);
    this.view = new DataView(this.buffer);
    this.bytes = new Uint8Array(this.buffer);
  }

  public begin(): void {
    this.offset = 0;
    this.ensure(VERSION_SIZE);
    this.writeU32(GAMEPAD_BATCH_VERSION);
  }

  /** True when no records were written since `begin()`. */
  public get isEmpty(): boolean {
    return this.offset <= VERSION_SIZE;
  }

  /** Set up buffer size/initialized values for a connected device */
  public connected(
    deviceId: number,
    mapping: GamepadMappingKind,
    buttonValues: ArrayLike<number>,
    axes: ArrayLike<number>,
  ): void {
    const nButtons = Math.min(buttonValues.length, GAMEPAD_MAX_BUTTONS);
    const nAxes = Math.min(axes.length, GAMEPAD_MAX_AXES);
    this.ensure(CONNECTED_HEADER_SIZE + (nButtons + nAxes) * VALUE_SIZE);
    this.writeU8(GamepadRecordType.Connected);
    this.writeI32(deviceId);
    this.writeU8(mapping);
    this.writeU8(nButtons);
    this.writeU8(nAxes);
    this.writeU8(0); // padding
    for (let i = 0; i < nButtons; i++) {
      this.writeF32(buttonValues[i]);
    }
    for (let i = 0; i < nAxes; i++) {
      this.writeF32(axes[i]);
    }
  }

  /**  */
  public update(
    deviceId: number,
    kind: GamepadChangeKind,
    index: number,
    value: number,
  ): void {
    this.ensure(UPDATE_RECORD_SIZE);
    this.writeU8(GamepadRecordType.Update);
    this.writeI32(deviceId);
    this.writeU8(1); // one change per record
    this.writeU8(kind);
    this.writeU8(index);
    this.writeF32(value);
  }

  public disconnected(deviceId: number): void {
    this.ensure(DISCONNECTED_RECORD_SIZE);
    this.writeU8(GamepadRecordType.Disconnected);
    this.writeI32(deviceId);
  }

  public end(): Uint8Array {
    return this.bytes.subarray(0, this.offset);
  }

  /** ---------------- Helper/private methods ---------------- */
  // The below write* methods write a value to the buffer and increment the offset position in our central buffer

  private writeU8(value: number): void {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  private writeU32(value: number): void {
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  private writeI32(value: number): void {
    this.view.setInt32(this.offset, value, true);
    this.offset += 4;
  }

  private writeF32(value: number): void {
    this.view.setFloat32(this.offset, value, true);
    this.offset += 4;
  }

  // Increase the byte buffer size if necessary
  private ensure(additional: number): void {
    const required = this.offset + additional;
    if (required <= this.buffer.byteLength) {
      return;
    }
    let capacity = this.buffer.byteLength * 2;
    while (capacity < required) {
      capacity *= 2;
    }
    const grown = new ArrayBuffer(capacity);
    const grownBytes = new Uint8Array(grown);
    grownBytes.set(this.bytes.subarray(0, this.offset));
    this.buffer = grown;
    this.view = new DataView(grown);
    this.bytes = grownBytes;
  }
}
