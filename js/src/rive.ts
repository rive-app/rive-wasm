import * as rc from "./rive_advanced.mjs";
import packageData from "package.json";
import { Animation } from "./animation";
import {
  registerTouchInteractions,
  sanitizeUrl,
  BLANK_URL,
  ImageWrapper,
  AudioWrapper,
  FontWrapper,
  finalizationRegistry,
  CustomFileAssetLoaderWrapper,
} from "./utils";

export type AssetLoadCallback = (
  asset: rc.FileAsset,
  bytes: Uint8Array,
) => Boolean;

class RiveError extends Error {
  public isHandledError = true;
}

// Note: Re-exporting a few types from rive_advanced.mjs to expose for high-level
// API usage without re-defining their type definition here. May want to revisit
// and see if we want to expose both types from rive.ts and rive_advanced.mjs in
// the future
export type {
  FileAsset,
  AudioAsset,
  FontAsset,
  ImageAsset,
} from "./rive_advanced.mjs";

/**
 * Generic type for a parameterless void callback
 */
export type VoidCallback = () => void;

interface SetupRiveListenersOptions {
  isTouchScrollEnabled?: boolean;
}

/**
 * Type for artboard bounds
 */
export type Bounds = rc.AABB;

// #regions helpers
const resolveErrorMessage = (error: any): string =>
  error && error.isHandledError
    ? error.message
    : "Problem loading file; may be corrupt!";

// #region layout

// Fit options for the canvas
export enum Fit {
  Cover = "cover",
  Contain = "contain",
  Fill = "fill",
  FitWidth = "fitWidth",
  FitHeight = "fitHeight",
  None = "none",
  ScaleDown = "scaleDown",
  Layout = "layout",
}

// Alignment options for the canvas
export enum Alignment {
  Center = "center",
  TopLeft = "topLeft",
  TopCenter = "topCenter",
  TopRight = "topRight",
  CenterLeft = "centerLeft",
  CenterRight = "centerRight",
  BottomLeft = "bottomLeft",
  BottomCenter = "bottomCenter",
  BottomRight = "bottomRight",
}

// Interface for the Layout static method contructor
export interface LayoutParameters {
  fit?: Fit;
  alignment?: Alignment;
  layoutScaleFactor?: number;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}

// Alignment options for Rive animations in a HTML canvas
export class Layout {
  // Runtime fit and alignment are accessed every frame, so we cache their
  // values to save cycles
  private cachedRuntimeFit: rc.Fit;
  private cachedRuntimeAlignment: rc.Alignment;

  public readonly fit: Fit;
  public readonly alignment: Alignment;
  public readonly layoutScaleFactor: number;
  public readonly minX: number;
  public readonly minY: number;
  public readonly maxX: number;
  public readonly maxY: number;

  constructor(params?: LayoutParameters) {
    this.fit = params?.fit ?? Fit.Contain;
    this.alignment = params?.alignment ?? Alignment.Center;
    this.layoutScaleFactor = params?.layoutScaleFactor ?? 1;
    this.minX = params?.minX ?? 0;
    this.minY = params?.minY ?? 0;
    this.maxX = params?.maxX ?? 0;
    this.maxY = params?.maxY ?? 0;
  }

  // Alternative constructor to build a Layout from an interface/object
  static new({
    fit,
    alignment,
    minX,
    minY,
    maxX,
    maxY,
  }: LayoutParameters): Layout {
    console.warn(
      "This function is deprecated: please use `new Layout({})` instead",
    );
    return new Layout({ fit, alignment, minX, minY, maxX, maxY });
  }

  /**
   * Makes a copy of the layout, replacing any specified parameters
   */
  public copyWith({
    fit,
    alignment,
    layoutScaleFactor,
    minX,
    minY,
    maxX,
    maxY,
  }: LayoutParameters): Layout {
    return new Layout({
      fit: fit ?? this.fit,
      alignment: alignment ?? this.alignment,
      layoutScaleFactor: layoutScaleFactor ?? this.layoutScaleFactor,
      minX: minX ?? this.minX,
      minY: minY ?? this.minY,
      maxX: maxX ?? this.maxX,
      maxY: maxY ?? this.maxY,
    });
  }

  // Returns fit for the Wasm runtime format
  public runtimeFit(rive: rc.RiveCanvas): rc.Fit {
    if (this.cachedRuntimeFit) return this.cachedRuntimeFit;

    let fit;
    if (this.fit === Fit.Cover) fit = rive.Fit.cover;
    else if (this.fit === Fit.Contain) fit = rive.Fit.contain;
    else if (this.fit === Fit.Fill) fit = rive.Fit.fill;
    else if (this.fit === Fit.FitWidth) fit = rive.Fit.fitWidth;
    else if (this.fit === Fit.FitHeight) fit = rive.Fit.fitHeight;
    else if (this.fit === Fit.ScaleDown) fit = rive.Fit.scaleDown;
    else if (this.fit === Fit.Layout) fit = rive.Fit.layout;
    else fit = rive.Fit.none;

    this.cachedRuntimeFit = fit;
    return fit;
  }

  // Returns alignment for the Wasm runtime format
  public runtimeAlignment(rive: rc.RiveCanvas): rc.Alignment {
    if (this.cachedRuntimeAlignment) return this.cachedRuntimeAlignment;

    let alignment;
    if (this.alignment === Alignment.TopLeft)
      alignment = rive.Alignment.topLeft;
    else if (this.alignment === Alignment.TopCenter)
      alignment = rive.Alignment.topCenter;
    else if (this.alignment === Alignment.TopRight)
      alignment = rive.Alignment.topRight;
    else if (this.alignment === Alignment.CenterLeft)
      alignment = rive.Alignment.centerLeft;
    else if (this.alignment === Alignment.CenterRight)
      alignment = rive.Alignment.centerRight;
    else if (this.alignment === Alignment.BottomLeft)
      alignment = rive.Alignment.bottomLeft;
    else if (this.alignment === Alignment.BottomCenter)
      alignment = rive.Alignment.bottomCenter;
    else if (this.alignment === Alignment.BottomRight)
      alignment = rive.Alignment.bottomRight;
    else alignment = rive.Alignment.center;

    this.cachedRuntimeAlignment = alignment;
    return alignment;
  }
}

// #endregion

// #region runtime

// Callback type when looking for a runtime instance
export type RuntimeCallback = (rive: rc.RiveCanvas) => void;

// Runtime singleton; use getInstance to provide a callback that returns the
// Rive runtime
export class RuntimeLoader {
  // Singleton helpers
  private static runtime: rc.RiveCanvas;
  // Flag to indicate that loading has started/completed
  private static isLoading = false;
  // List of callbacks for the runtime that come in while loading
  private static callBackQueue: RuntimeCallback[] = [];
  // Instance of the Rive runtime
  private static rive: rc.RiveCanvas;
  // Path to the Wasm file; default path works for testing only;
  // if embedded wasm is used then this is never used.
  private static wasmURL = `https://unpkg.com/${packageData.name}@${packageData.version}/rive.wasm`;

  // Class is never instantiated
  private constructor() {}

  // Loads the runtime
  private static loadRuntime(): void {
    rc.default({
      // Loads Wasm bundle
      locateFile: () => RuntimeLoader.wasmURL,
    })
      .then((rive: rc.RiveCanvas) => {
        RuntimeLoader.runtime = rive;
        // Fire all the callbacks
        while (RuntimeLoader.callBackQueue.length > 0) {
          RuntimeLoader.callBackQueue.shift()?.(RuntimeLoader.runtime);
        }
      })
      .catch((error) => {
        // Capture specific error details
        const errorDetails = {
          message: error?.message || "Unknown error",
          type: error?.name || "Error",
          // Some browsers may provide additional WebAssembly-specific details
          wasmError:
            error instanceof WebAssembly.CompileError ||
            error instanceof WebAssembly.RuntimeError,
          originalError: error,
        };

        // Log detailed error for debugging
        console.debug("Rive WASM load error details:", errorDetails);

        // In case unpkg fails, or the wasm was not supported, we try to load the fallback module from jsdelivr.
        // This `rive_fallback.wasm` is compiled to support older architecture.
        // TODO: (Gordon): preemptively test browser support and load the correct wasm file. Then use jsdelvr only if unpkg fails.
        const backupJsdelivrUrl = `https://cdn.jsdelivr.net/npm/${packageData.name}@${packageData.version}/rive_fallback.wasm`;
        if (RuntimeLoader.wasmURL.toLowerCase() !== backupJsdelivrUrl) {
          console.warn(
            `Failed to load WASM from ${RuntimeLoader.wasmURL} (${errorDetails.message}), trying jsdelivr as a backup`,
          );
          RuntimeLoader.setWasmUrl(backupJsdelivrUrl);
          RuntimeLoader.loadRuntime();
        } else {
          const errorMessage = [
            `Could not load Rive WASM file from ${RuntimeLoader.wasmURL} or ${backupJsdelivrUrl}.`,
            "Possible reasons:",
            "- Network connection is down",
            "- WebAssembly is not supported in this environment",
            "- The WASM file is corrupted or incompatible",
            "\nError details:",
            `- Type: ${errorDetails.type}`,
            `- Message: ${errorDetails.message}`,
            `- WebAssembly-specific error: ${errorDetails.wasmError}`,
            "\nTo resolve, you may need to:",
            "1. Check your network connection",
            "2. Set a new WASM source via RuntimeLoader.setWasmUrl()",
            "3. Call RuntimeLoader.loadRuntime() again",
          ].join("\n");

          console.error(errorMessage);
        }
      });
  }

  // Provides a runtime instance via a callback
  public static getInstance(callback: RuntimeCallback): void {
    // If it's not loading, start loading runtime
    if (!RuntimeLoader.isLoading) {
      RuntimeLoader.isLoading = true;
      RuntimeLoader.loadRuntime();
    }
    if (!RuntimeLoader.runtime) {
      RuntimeLoader.callBackQueue.push(callback);
    } else {
      callback(RuntimeLoader.runtime);
    }
  }

  // Provides a runtime instance via a promise
  public static awaitInstance(): Promise<rc.RiveCanvas> {
    return new Promise<rc.RiveCanvas>((resolve) =>
      RuntimeLoader.getInstance((rive: rc.RiveCanvas): void => resolve(rive)),
    );
  }

  // Manually sets the wasm url
  public static setWasmUrl(url: string): void {
    RuntimeLoader.wasmURL = url;
  }

  // Gets the current wasm url
  public static getWasmUrl(): string {
    return RuntimeLoader.wasmURL;
  }
}

// #endregion

// #region state machines

export enum StateMachineInputType {
  Number = 56,
  Trigger = 58,
  Boolean = 59,
}

/**
 * An input for a state machine
 */
export class StateMachineInput {
  constructor(
    public readonly type: StateMachineInputType,
    private runtimeInput: rc.SMIInput,
  ) {}

  /**
   * Returns the name of the input
   */
  public get name(): string {
    return this.runtimeInput.name;
  }

  /**
   * Returns the current value of the input
   */
  public get value(): number | boolean {
    return this.runtimeInput.value;
  }

  /**
   * Sets the value of the input
   */
  public set value(value: number | boolean) {
    this.runtimeInput.value = value;
  }

  /**
   * Fires a trigger; does nothing on Number or Boolean input types
   */
  public fire(): void {
    if (this.type === StateMachineInputType.Trigger) {
      this.runtimeInput.fire();
    }
  }

  /**
   * Deletes the input
   */
  public delete(): void {
    this.runtimeInput = null;
  }
}

export enum RiveEventType {
  General = 128,
  OpenUrl = 131,
}

class StateMachine {
  /**
   * Caches the inputs from the runtime
   */
  public readonly inputs: StateMachineInput[] = [];

  /**
   * Runtime state machine instance
   */
  public readonly instance: rc.StateMachineInstance;

  /**
   * @constructor
   * @param stateMachine runtime state machine object
   * @param instance runtime state machine instance object
   */
  constructor(
    private stateMachine: rc.StateMachine,
    runtime: rc.RiveCanvas,
    public playing: boolean,
    private artboard: rc.Artboard,
  ) {
    this.instance = new runtime.StateMachineInstance(stateMachine, artboard);
    this.initInputs(runtime);
  }

  public get name(): string {
    return this.stateMachine.name;
  }

  /**
   * Returns a list of state names that have changed on this frame
   */
  public get statesChanged(): string[] {
    const names: string[] = [];
    for (let i = 0; i < this.instance.stateChangedCount(); i++) {
      names.push(this.instance.stateChangedNameByIndex(i));
    }
    return names;
  }

  /**
   * Advances the state machine instance by a given time.
   * @param time - the time to advance the animation by in seconds
   */
  public advance(time: number) {
    this.instance.advance(time);
  }

  /**
   * Advances the state machine instance by a given time and apply changes to artboard.
   * @param time - the time to advance the animation by in seconds
   */
  public advanceAndApply(time: number) {
    this.instance.advanceAndApply(time);
  }

  /**
   * Returns the number of events reported from the last advance call
   * @returns Number of events reported
   */
  public reportedEventCount(): number {
    return this.instance.reportedEventCount();
  }

  /**
   * Returns a RiveEvent object emitted from the last advance call at the given index
   * of a list of potentially multiple events. If an event at the index is not found,
   * undefined is returned.
   * @param i index of the event reported in a list of potentially multiple events
   * @returns RiveEvent or extended RiveEvent object returned, or undefined
   */
  reportedEventAt(i: number): rc.OpenUrlEvent | rc.RiveEvent | undefined {
    return this.instance.reportedEventAt(i);
  }

  /**
   * Fetches references to the state machine's inputs and caches them
   * @param runtime an instance of the runtime; needed for the SMIInput types
   */
  private initInputs(runtime: rc.RiveCanvas): void {
    // Fetch the inputs from the runtime if we don't have them
    for (let i = 0; i < this.instance.inputCount(); i++) {
      const input = this.instance.input(i);
      this.inputs.push(this.mapRuntimeInput(input, runtime));
    }
  }

  /**
   * Maps a runtime input to it's appropriate type
   * @param input
   */
  private mapRuntimeInput(
    input: rc.SMIInput,
    runtime: rc.RiveCanvas,
  ): StateMachineInput {
    if (input.type === runtime.SMIInput.bool) {
      return new StateMachineInput(
        StateMachineInputType.Boolean,
        input.asBool(),
      );
    } else if (input.type === runtime.SMIInput.number) {
      return new StateMachineInput(
        StateMachineInputType.Number,
        input.asNumber(),
      );
    } else if (input.type === runtime.SMIInput.trigger) {
      return new StateMachineInput(
        StateMachineInputType.Trigger,
        input.asTrigger(),
      );
    }
  }

  /**
   * Deletes the backing Wasm state machine instance; once this is called, this
   * state machine is no more.
   */
  public cleanup() {
    this.inputs.forEach((input) => {
      input.delete();
    });
    this.inputs.length = 0;
    this.instance.delete();
  }

  public bindViewModelInstance(viewModelInstance: ViewModelInstance) {
    if (viewModelInstance.runtimeInstance != null) {
      this.instance.bindViewModelInstance(viewModelInstance.runtimeInstance);
    }
  }
}

// #endregion

// #region animator

/**
 * Manages animation
 */
class Animator {
  /**
   * Constructs a new animator
   * @constructor
   * @param runtime Rive runtime; needed to instance animations & state machines
   * @param artboard the artboard that holds all animations and state machines
   * @param animations optional list of animations
   * @param stateMachines optional list of state machines
   */
  constructor(
    private runtime: rc.RiveCanvas,
    private artboard: rc.Artboard,
    private eventManager: EventManager,
    public readonly animations: Animation[] = [],
    public readonly stateMachines: StateMachine[] = [],
  ) {}

  /**
   * Adds animations and state machines by their names. If names are shared
   * between animations & state machines, then the first one found will be
   * created. Best not to use the same names for these in your Rive file.
   * @param animatable the name(s) of animations and state machines to add
   * @returns a list of names of the playing animations and state machines
   */
  public add(
    animatables: string | string[],
    playing: boolean,
    fireEvent = true,
  ): string[] {
    animatables = mapToStringArray(animatables);
    // If animatables is empty, play or pause everything
    if (animatables.length === 0) {
      this.animations.forEach((a) => (a.playing = playing));
      this.stateMachines.forEach((m) => (m.playing = playing));
    } else {
      // Play/pause already instanced items, or create new instances
      const instancedAnimationNames = this.animations.map((a) => a.name);
      const instancedMachineNames = this.stateMachines.map((m) => m.name);
      for (let i = 0; i < animatables.length; i++) {
        const aIndex = instancedAnimationNames.indexOf(animatables[i]);
        const mIndex = instancedMachineNames.indexOf(animatables[i]);
        if (aIndex >= 0 || mIndex >= 0) {
          if (aIndex >= 0) {
            // Animation is instanced, play/pause it
            this.animations[aIndex].playing = playing;
          } else {
            // State machine is instanced, play/pause it
            this.stateMachines[mIndex].playing = playing;
          }
        } else {
          // Try to create a new animation instance
          const anim = this.artboard.animationByName(animatables[i]);
          if (anim) {
            const newAnimation = new Animation(
              anim,
              this.artboard,
              this.runtime,
              playing,
            );
            // Display the first frame of the specified animation
            newAnimation.advance(0);
            newAnimation.apply(1.0);
            this.animations.push(newAnimation);
          } else {
            // Try to create a new state machine instance
            const sm = this.artboard.stateMachineByName(animatables[i]);
            if (sm) {
              const newStateMachine = new StateMachine(
                sm,
                this.runtime,
                playing,
                this.artboard,
              );
              this.stateMachines.push(newStateMachine);
            }
          }
        }
      }
    }
    // Fire play/paused events for animations
    if (fireEvent) {
      if (playing) {
        this.eventManager.fire({
          type: EventType.Play,
          data: this.playing,
        });
      } else {
        this.eventManager.fire({
          type: EventType.Pause,
          data: this.paused,
        });
      }
    }

    return playing ? this.playing : this.paused;
  }

  /**
   * Adds linear animations by their names.
   * @param animatables the name(s) of animations to add
   * @param playing whether animations should play on instantiation
   */
  public initLinearAnimations(animatables: string[], playing: boolean) {
    // Play/pause already instanced items, or create new instances
    // This validation is kept to maintain compatibility with current behavior.
    // But given that it this is called during artboard initialization
    // it should probably be safe to remove.
    const instancedAnimationNames = this.animations.map((a) => a.name);
    for (let i = 0; i < animatables.length; i++) {
      const aIndex = instancedAnimationNames.indexOf(animatables[i]);
      if (aIndex >= 0) {
        this.animations[aIndex].playing = playing;
      } else {
        // Try to create a new animation instance
        const anim = this.artboard.animationByName(animatables[i]);
        if (anim) {
          const newAnimation = new Animation(
            anim,
            this.artboard,
            this.runtime,
            playing,
          );
          // Display the first frame of the specified animation
          newAnimation.advance(0);
          newAnimation.apply(1.0);
          this.animations.push(newAnimation);
        } else {
          console.error(`Animation with name ${animatables[i]} not found.`);
        }
      }
    }
  }

  /**
   * Adds state machines by their names.
   * @param animatables the name(s) of state machines to add
   * @param playing whether state machines should play on instantiation
   */
  public initStateMachines(animatables: string[], playing: boolean) {
    // Play/pause already instanced items, or create new instances
    // This validation is kept to maintain compatibility with current behavior.
    // But given that it this is called during artboard initialization
    // it should probably be safe to remove.
    const instancedStateMachineNames = this.stateMachines.map((a) => a.name);
    for (let i = 0; i < animatables.length; i++) {
      const aIndex = instancedStateMachineNames.indexOf(animatables[i]);
      if (aIndex >= 0) {
        this.stateMachines[aIndex].playing = playing;
      } else {
        // Try to create a new state machine instance
        const sm = this.artboard.stateMachineByName(animatables[i]);
        if (sm) {
          const newStateMachine = new StateMachine(
            sm,
            this.runtime,
            playing,
            this.artboard,
          );
          this.stateMachines.push(newStateMachine);
          if (!playing) {
            newStateMachine.advanceAndApply(0);
          }
        } else {
          console.warn(`State Machine with name ${animatables[i]} not found.`);
          // In order to maintain compatibility with current behavior, if a state machine is not found
          // we look for an animation with the same name
          this.initLinearAnimations([animatables[i]], playing);
        }
      }
    }
  }

  /**
   * Play the named animations/state machines
   * @param animatables the names of the animations/machines to play; plays all if empty
   * @returns a list of the playing items
   */
  public play(animatables: string | string[]): string[] {
    return this.add(animatables, true);
  }

  /**
   * Pauses named animations and state machines, or everything if nothing is
   * specified
   * @param animatables names of the animations and state machines to pause
   * @returns a list of names of the animations and state machines paused
   */
  public pause(animatables: string[]): string[] {
    return this.add(animatables, false);
  }

  /**
   * Set time of named animations
   * @param animations names of the animations to scrub
   * @param value time scrub value, a floating point number to which the playhead is jumped
   * @returns a list of names of the animations that were scrubbed
   */
  public scrub(animatables: string[], value: number): string[] {
    const forScrubbing = this.animations.filter((a) =>
      animatables.includes(a.name),
    );
    forScrubbing.forEach((a) => (a.scrubTo = value));
    return forScrubbing.map((a) => a.name);
  }

  /**
   * Returns a list of names of all animations and state machines currently
   * playing
   */
  public get playing(): string[] {
    return this.animations
      .filter((a) => a.playing)
      .map((a) => a.name)
      .concat(this.stateMachines.filter((m) => m.playing).map((m) => m.name));
  }

  /**
   * Returns a list of names of all animations and state machines currently
   * paused
   */
  public get paused(): string[] {
    return this.animations
      .filter((a) => !a.playing)
      .map((a) => a.name)
      .concat(this.stateMachines.filter((m) => !m.playing).map((m) => m.name));
  }

  /**
   * Stops and removes all named animations and state machines
   * @param animatables animations and state machines to remove
   * @returns a list of names of removed items
   */
  public stop(animatables?: string[] | string): string[] {
    animatables = mapToStringArray(animatables);

    // If nothing's specified, wipe them out, all of them
    let removedNames: string[] = [];
    // Stop everything
    if (animatables.length === 0) {
      removedNames = this.animations
        .map((a) => a.name)
        .concat(this.stateMachines.map((m) => m.name));
      // Clean up before emptying the arrays
      this.animations.forEach((a) => a.cleanup());
      this.stateMachines.forEach((m) => m.cleanup());
      // Empty out the arrays
      this.animations.splice(0, this.animations.length);
      this.stateMachines.splice(0, this.stateMachines.length);
    } else {
      // Remove only the named animations/state machines
      const animationsToRemove = this.animations.filter((a) =>
        animatables.includes(a.name),
      );

      animationsToRemove.forEach((a) => {
        a.cleanup();
        this.animations.splice(this.animations.indexOf(a), 1);
      });
      const machinesToRemove = this.stateMachines.filter((m) =>
        animatables.includes(m.name),
      );
      machinesToRemove.forEach((m) => {
        m.cleanup();
        this.stateMachines.splice(this.stateMachines.indexOf(m), 1);
      });
      removedNames = animationsToRemove
        .map((a) => a.name)
        .concat(machinesToRemove.map((m) => m.name));
    }

    this.eventManager.fire({
      type: EventType.Stop,
      data: removedNames,
    });

    // Return the list of animations removed
    return removedNames;
  }

  /**
   * Returns true if at least one animation is active
   */
  public get isPlaying(): boolean {
    return (
      this.animations.reduce((acc, curr) => acc || curr.playing, false) ||
      this.stateMachines.reduce((acc, curr) => acc || curr.playing, false)
    );
  }

  /**
   * Returns true if all animations are paused and there's at least one animation
   */
  public get isPaused(): boolean {
    return (
      !this.isPlaying &&
      (this.animations.length > 0 || this.stateMachines.length > 0)
    );
  }

  /**
   * Returns true if there are no playing or paused animations/state machines
   */
  public get isStopped(): boolean {
    return this.animations.length === 0 && this.stateMachines.length === 0;
  }

  /**
   * If there are no animations or state machines, add the first one found
   * @returns the name of the animation or state machine instanced
   */
  public atLeastOne(playing: boolean, fireEvent = true): string {
    let instancedName: string;
    if (this.animations.length === 0 && this.stateMachines.length === 0) {
      if (this.artboard.animationCount() > 0) {
        // Add the first animation
        this.add(
          [(instancedName = this.artboard.animationByIndex(0).name)],
          playing,
          fireEvent,
        );
      } else if (this.artboard.stateMachineCount() > 0) {
        // Add the first state machine
        this.add(
          [(instancedName = this.artboard.stateMachineByIndex(0).name)],
          playing,
          fireEvent,
        );
      }
    }
    return instancedName;
  }

  /**
   * Checks if any animations have looped and if so, fire the appropriate event
   */
  public handleLooping() {
    for (const animation of this.animations.filter((a) => a.playing)) {
      // Emit if the animation looped
      if (animation.loopValue === 0 && animation.loopCount) {
        animation.loopCount = 0;
        // This is a one-shot; if it has ended, delete the instance
        this.stop(animation.name);
      } else if (animation.loopValue === 1 && animation.loopCount) {
        this.eventManager.fire({
          type: EventType.Loop,
          data: { animation: animation.name, type: LoopType.Loop },
        });
        animation.loopCount = 0;
      }
      // Wasm indicates a loop at each time the animation
      // changes direction, so a full loop/lap occurs every
      // two loop counts
      else if (animation.loopValue === 2 && animation.loopCount > 1) {
        this.eventManager.fire({
          type: EventType.Loop,
          data: { animation: animation.name, type: LoopType.PingPong },
        });
        animation.loopCount = 0;
      }
    }
  }

  /**
   * Checks if states have changed in state machines and fires a statechange
   * event
   */
  public handleStateChanges() {
    const statesChanged: string[] = [];
    for (const stateMachine of this.stateMachines.filter((sm) => sm.playing)) {
      statesChanged.push(...stateMachine.statesChanged);
    }
    if (statesChanged.length > 0) {
      this.eventManager.fire({
        type: EventType.StateChange,
        data: statesChanged,
      });
    }
  }

  public handleAdvancing(time: number) {
    this.eventManager.fire({
      type: EventType.Advance,
      data: time,
    });
  }
}

// #endregion

// #region events

/**
 * Supported event types triggered in Rive
 */
export enum EventType {
  Load = "load",
  LoadError = "loaderror",
  Play = "play",
  Pause = "pause",
  Stop = "stop",
  Loop = "loop",
  Draw = "draw",
  Advance = "advance",
  StateChange = "statechange",
  RiveEvent = "riveevent",
  AudioStatusChange = "audiostatuschange", // internal event. TODO: split
}

export type RiveEventPayload = rc.RiveEvent | rc.OpenUrlEvent;

// Event reported by Rive for significant events during animation playback (i.e. play, pause, stop, etc.),
// as well as for custom Rive events reported from the state machine defined at design-time.
export interface Event {
  type: EventType;
  data?: string | string[] | LoopEvent | number | RiveEventPayload | RiveFile;
}

/**
 * Looping types: one-shot, loop, and ping-pong
 */
export enum LoopType {
  OneShot = "oneshot", // has value 0 in runtime
  Loop = "loop", // has value 1 in runtime
  PingPong = "pingpong", // has value 2 in runtime
}

/**
 * Loop events are returned through onloop callbacks
 */
export interface LoopEvent {
  animation: string;
  type: LoopType;
}

/**
 * Loop events are returned through onloop callbacks
 */
export type EventCallback = (event: Event) => void;

/**
 * Event listeners registered with the event manager
 */
export interface EventListener {
  type: EventType;
  callback: EventCallback;
}

/**
 * FPS Reporting through callbacks sent to the WASM runtime
 */
export type FPSCallback = (fps: number) => void;

// Manages Rive events and listeners
class EventManager {
  constructor(private listeners: EventListener[] = []) {}

  // Gets listeners of specified type
  private getListeners(type: EventType): EventListener[] {
    return this.listeners.filter((e) => e.type === type);
  }

  // Adds a listener
  public add(listener: EventListener): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Removes a listener
   * @param listener the listener with the callback to be removed
   */
  public remove(listener: EventListener): void {
    // We can't simply look for the listener as it'll be a different instance to
    // one originally subscribed. Find all the listeners of the right type and
    // then check their callbacks which should match.
    for (let i = 0; i < this.listeners.length; i++) {
      const currentListener = this.listeners[i];
      if (currentListener.type === listener.type) {
        if (currentListener.callback === listener.callback) {
          this.listeners.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Clears all listeners of specified type, or every listener if no type is
   * specified
   * @param type the type of listeners to clear, or all listeners if not
   * specified
   */
  public removeAll(type?: EventType) {
    if (!type) {
      this.listeners.splice(0, this.listeners.length);
    } else {
      this.listeners
        .filter((l) => l.type === type)
        .forEach((l) => this.remove(l));
    }
  }

  // Fires an event
  public fire(event: Event): void {
    const eventListeners = this.getListeners(event.type);
    eventListeners.forEach((listener) => listener.callback(event));
  }
}

// #endregion

// #region Manages a queue of tasks

// A task in the queue; will fire the action when the queue is processed; will
// also optionally fire an event.
export interface Task {
  action?: VoidCallback;
  event?: Event;
}

// Manages a queue of tasks
class TaskQueueManager {
  private queue: Task[] = [];

  constructor(private eventManager: EventManager) {}

  // Adds a task top the queue
  public add(task: Task): void {
    this.queue.push(task);
  }

  // Processes all tasks in the queue
  public process(): void {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task?.action) {
        task.action();
      }
      if (task?.event) {
        this.eventManager.fire(task.event);
      }
    }
  }
}

// #endregion

// #region Audio

enum SystemAudioStatus {
  AVAILABLE,
  UNAVAILABLE,
}

// Class to handle audio context availability and status changes
class AudioManager extends EventManager {
  private _started: boolean = false;
  private _enabled: boolean = false;

  private _status: SystemAudioStatus = SystemAudioStatus.UNAVAILABLE;
  private _audioContext: AudioContext;

  private async delay(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  private async timeout() {
    return new Promise((_, reject) => setTimeout(reject, 50));
  }

  // Alerts animations on status changes and removes the listeners to avoid alerting twice.
  private reportToListeners() {
    this.fire({ type: EventType.AudioStatusChange });
    this.removeAll();
  }

  /**
   * The audio context has been resolved.
   * Alert any listeners that we can now play audio.
   * Rive will now play audio at the configured volume.
   */
  private async enableAudio() {
    if (!this._enabled) {
      this._enabled = true;
      this._status = SystemAudioStatus.AVAILABLE;
      this.reportToListeners();
    }
  }

  /**
   * Check if we are able to play audio.
   *
   * We currently check the audio context, when resume() returns before a timeout we know that the
   * audio context is running and we can enable audio.
   */
  private async testAudio() {
    if (
      this._status === SystemAudioStatus.UNAVAILABLE &&
      this._audioContext !== null
    ) {
      // if the audio context is not available, it will never resume,
      // so the timeout will throw after 50ms and a new cycle will start
      try {
        await Promise.race([this._audioContext.resume(), this.timeout()]);
        this.enableAudio();
      } catch {
        // we expect the promise race to timeout, which we ignore.
      }
    }
  }

  /**
   * Establish audio for use with rive.
   * We both test if we can use audio intermittently and listen for user interaction.
   * The aim is to enable audio playback as soon as the browser allows this.
   */
  private async _establishAudio() {
    if (!this._started) {
      this._started = true;
      // If window doesn't exist we assume they are not in a browser context
      // so audio will not be blocked
      if (typeof window == "undefined") {
        this.enableAudio();
      } else {
        this._audioContext = new AudioContext();
        this.listenForUserAction();
        while (this._status === SystemAudioStatus.UNAVAILABLE) {
          await this.testAudio();
          await this.delay(1000);
        }
      }
    }
  }

  private listenForUserAction() {
    // NOTE: AudioContexts are ready immediately if requested in a ui callback
    // we *could* re request one in this listener.
    const _clickListener = async () => {
      // note this has "better" results than calling `await this.testAudio()`
      // as we force audio to be enabled in the current thread, rather than chancing
      // the thread to be passed over for some other async context

      this.enableAudio();
    };
    // NOTE: we should test this on mobile/pads
    document.addEventListener("pointerdown", _clickListener, {
      once: true,
    });
  }

  /**
   * Establish the audio context for rive, this lets rive know that we can play audio.
   */
  public async establishAudio() {
    this._establishAudio();
  }

  public get systemVolume() {
    if (this._status === SystemAudioStatus.UNAVAILABLE) {
      // We do an immediate test to avoid depending on the delay of the running test
      this.testAudio();
      return 0;
    }
    return 1;
  }

  public get status(): SystemAudioStatus {
    return this._status;
  }
}

const audioManager = new AudioManager();

// #endregion

// #region Observers

type ObservedObject = {
  onResize: Function;
  element: HTMLCanvasElement;
};

type MyResizeObserverType = {
  observe: Function;
  unobserve: Function;
  disconnect: Function;
};

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const MyResizeObserver = globalThis.ResizeObserver || FakeResizeObserver;

/**
 * This class takes care of any observers that will be attached to an animation.
 * It should be treated as a singleton because observers are much more performant
 * when used for observing multiple elements by a single instance.
 */

class ObjectObservers {
  private _elementsMap: Map<HTMLCanvasElement, ObservedObject> = new Map();

  private _resizeObserver: MyResizeObserverType;

  constructor() {
    this._resizeObserver = new MyResizeObserver(this._onObserved);
  }

  /**
   * Resize observers trigger both when the element changes its size and also when the
   * element is added or removed from the document.
   */
  private _onObservedEntry = (entry: ResizeObserverEntry) => {
    const observed = this._elementsMap.get(entry.target as HTMLCanvasElement);
    if (observed !== null) {
      observed.onResize(
        entry.target.clientWidth == 0 || entry.target.clientHeight == 0,
      );
    } else {
      this._resizeObserver.unobserve(entry.target);
    }
  };

  private _onObserved = (entries: ResizeObserverEntry[]) => {
    entries.forEach(this._onObservedEntry);
  };

  // Adds an observable element
  public add(element: HTMLCanvasElement, onResize: Function) {
    let observed: ObservedObject = {
      onResize,
      element,
    };
    this._elementsMap.set(element, observed);
    this._resizeObserver.observe(element);
    return observed;
  }

  // Removes an observable element
  public remove(observed: ObservedObject) {
    this._resizeObserver.unobserve(observed.element);
    this._elementsMap.delete(observed.element);
  }
}

const observers = new ObjectObservers();

// #endregion

// #region Rive

// Interface for the Rive static method contructor
export interface RiveParameters {
  canvas: HTMLCanvasElement | OffscreenCanvas; // canvas is required
  src?: string; // one of src or buffer or file is required
  buffer?: ArrayBuffer; // one of src or buffer or file is required
  riveFile?: RiveFile;
  artboard?: string;
  animations?: string | string[];
  stateMachines?: string | string[];
  layout?: Layout;
  autoplay?: boolean;
  useOffscreenRenderer?: boolean;
  /**
   * Allow the runtime to automatically load assets hosted in Rive's CDN.
   * enabled by default.
   */
  enableRiveAssetCDN?: boolean;
  /**
   * Turn off Rive Listeners. This means state machines that have Listeners
   * will not be invoked, and also, no event listeners pertaining to Listeners
   * will be attached to the <canvas> element
   */
  shouldDisableRiveListeners?: boolean;
  /**
   * For Rive Listeners, allows scrolling behavior to still occur on canvas elements
   * when a touch/drag action is performed on touch-enabled devices. Otherwise,
   * scroll behavior may be prevented on touch/drag actions on the canvas by default.
   */
  isTouchScrollEnabled?: boolean;
  /**
   * Enable Rive Events to be handled by the runtime. This means any special Rive Event may have
   * a side effect that takes place implicitly.
   *
   * For example, if during the render loop an OpenUrlEvent is detected, the
   * browser may try to open the specified URL in the payload.
   *
   * This flag is false by default to prevent any unwanted behaviors from taking place.
   * This means any special Rive Event will have to be handled manually by subscribing to
   * EventType.RiveEvent
   */
  automaticallyHandleEvents?: boolean;
  /**
   * Rive will look for a default view model and view model instance to bind to the artboard
   */
  autoBind?: boolean;
  onLoad?: EventCallback;
  onLoadError?: EventCallback;
  onPlay?: EventCallback;
  onPause?: EventCallback;
  onStop?: EventCallback;
  onLoop?: EventCallback;
  onStateChange?: EventCallback;
  onAdvance?: EventCallback;
  assetLoader?: AssetLoadCallback;
  /**
   * @deprecated Use `onLoad()` instead
   */
  onload?: EventCallback;
  /**
   * @deprecated Use `onLoadError()` instead
   */
  onloaderror?: EventCallback;
  /**
   * @deprecated Use `onPoad()` instead
   */
  onplay?: EventCallback;
  /**
   * @deprecated Use `onPause()` instead
   */
  onpause?: EventCallback;
  /**
   * @deprecated Use `onStop()` instead
   */
  onstop?: EventCallback;
  /**
   * @deprecated Use `onLoop()` instead
   */
  onloop?: EventCallback;
  /**
   * @deprecated Use `onStateChange()` instead
   */
  onstatechange?: EventCallback;
}

// Interface to Rive.load function
export interface RiveLoadParameters {
  src?: string;
  buffer?: ArrayBuffer;
  riveFile?: RiveFile;
  autoplay?: boolean;
  autoBind?: boolean;
  artboard?: string;
  animations?: string | string[];
  stateMachines?: string | string[];
  useOffscreenRenderer?: boolean;
  shouldDisableRiveListeners?: boolean;
}

// Interface ot Rive.reset function
export interface RiveResetParameters {
  artboard?: string;
  animations?: string | string[];
  stateMachines?: string | string[];
  autoplay?: boolean;
  autoBind?: boolean;
}
// Interface to RiveFile.load function
export interface RiveFileParameters {
  src?: string;
  buffer?: ArrayBuffer;
  assetLoader?: AssetLoadCallback;
  enableRiveAssetCDN?: boolean;
  onLoad?: EventCallback;
  onLoadError?: EventCallback;
}

export class RiveFile {
  // Error message for missing source or buffer
  private static readonly missingErrorMessage: string =
    "Rive source file or data buffer required";

  // Error message for file load error
  private static readonly fileLoadErrorMessage: string =
    "The file failed to load";

  // A url to a Rive file; may be undefined if a buffer is specified
  private src: string;

  // Raw Rive file data; may be undefined if a src is specified
  private buffer: ArrayBuffer;

  // Wasm runtime
  private runtime: rc.RiveCanvas;

  // Runtime file
  private file: rc.File;

  // AssetLoadCallback: allows customizing asset loading for images and fonts.
  private assetLoader: AssetLoadCallback;

  // Allow the runtime to automatically load assets hosted in Rive's runtime.
  private enableRiveAssetCDN: boolean = true;

  // Holds event listeners
  private eventManager: EventManager;

  private referenceCount: number = 0;

  private destroyed: boolean = false;

  constructor(params: RiveFileParameters) {
    this.src = params.src;
    this.buffer = params.buffer;

    if (params.assetLoader) this.assetLoader = params.assetLoader;
    this.enableRiveAssetCDN =
      typeof params.enableRiveAssetCDN == "boolean"
        ? params.enableRiveAssetCDN
        : true;

    // New event management system
    this.eventManager = new EventManager();
    if (params.onLoad) this.on(EventType.Load, params.onLoad);
    if (params.onLoadError) this.on(EventType.LoadError, params.onLoadError);
  }

  private async initData() {
    if (this.src) {
      this.buffer = await loadRiveFile(this.src);
    }
    if (this.destroyed) {
      return;
    }
    let loader;
    if (this.assetLoader) {
      const loaderWrapper = new CustomFileAssetLoaderWrapper(
        this.runtime,
        this.assetLoader,
      );
      loader = loaderWrapper.assetLoader;
    }
    // Load the Rive file
    this.file = await this.runtime.load(
      new Uint8Array(this.buffer),
      loader,
      this.enableRiveAssetCDN,
    );
    if (this.destroyed) {
      this.file?.delete();
      this.file = null;
      return;
    }
    if (this.file !== null) {
      this.eventManager.fire({
        type: EventType.Load,
        data: this,
      });
    } else {
      this.fireLoadError(RiveFile.fileLoadErrorMessage);
    }
  }

  public async init() {
    // If no source file url specified, it's a bust
    if (!this.src && !this.buffer) {
      this.fireLoadError(RiveFile.missingErrorMessage);
      return;
    }

    try {
      this.runtime = await RuntimeLoader.awaitInstance();

      if (this.destroyed) {
        return;
      }

      await this.initData();
    } catch (error) {
      this.fireLoadError(
        error instanceof Error ? error.message : RiveFile.fileLoadErrorMessage,
      );
    }
  }

  private fireLoadError(message: string): void {
    this.eventManager.fire({
      type: EventType.LoadError,
      data: message,
    });

    throw new Error(message);
  }

  /**
   * Subscribe to Rive-generated events
   * @param type the type of event to subscribe to
   * @param callback callback to fire when the event occurs
   */
  public on(type: EventType, callback: EventCallback) {
    this.eventManager.add({
      type: type,
      callback: callback,
    });
  }

  /**
   * Unsubscribes from a Rive-generated event
   * @param type the type of event to unsubscribe from
   * @param callback the callback to unsubscribe
   */
  public off(type: EventType, callback: EventCallback) {
    this.eventManager.remove({
      type: type,
      callback: callback,
    });
  }

  public cleanup() {
    this.referenceCount -= 1;
    if (this.referenceCount <= 0) {
      this.removeAllRiveEventListeners();
      this.file?.delete();
      this.file = null;
      this.destroyed = true;
    }
  }

  /**
   * Unsubscribes all Rive listeners from an event type, or everything if no type is
   * given
   * @param type the type of event to unsubscribe from, or all types if
   * undefined
   */
  public removeAllRiveEventListeners(type?: EventType) {
    this.eventManager.removeAll(type);
  }

  public getInstance(): rc.File {
    if (this.file !== null) {
      this.referenceCount += 1;
      return this.file;
    }
  }
}

export class Rive {
  // Canvas in which to render the artboard
  private readonly canvas: HTMLCanvasElement | OffscreenCanvas;

  // A url to a Rive file; may be undefined if a buffer is specified
  private src: string;

  // Raw Rive file data; may be undefined if a src is specified
  private buffer: ArrayBuffer;

  // The layout for rendering in the canvas
  private _layout: Layout;

  // The runtime renderer
  private renderer: rc.WrappedRenderer;

  // Tracks if a Rive file is loaded
  private loaded = false;

  // Tracks if a Rive file is destroyed
  private destroyed = false;

  // Reference of an object that handles any observers for the animation
  private _observed: ObservedObject | null = null;

  /**
   * Tracks if a Rive file is loaded; we need this in addition to loaded as some
   * commands (e.g. contents) can be called as soon as the file is loaded.
   * However, playback commands need to be queued and run in order once initial
   * animations and autoplay has been sorted out. This applies to play, pause,
   * and start.
   */
  private readyForPlaying = false;

  // Wasm runtime
  private runtime: rc.RiveCanvas;

  // Runtime artboard
  private artboard: rc.Artboard | null = null;

  // place to clear up event listeners
  private eventCleanup: VoidCallback | null = null;

  // Runtime file
  private file: rc.File;

  // Rive file instance
  private riveFile: RiveFile;

  // Holds event listeners
  private eventManager: EventManager;

  // Manages the loading task queue
  private taskQueue: TaskQueueManager;

  // Animator: manages animations and state machines
  private animator: Animator;

  // AssetLoadCallback: allows customizing asset loading for images and fonts.
  private assetLoader: AssetLoadCallback;

  // Error message for missing source or buffer
  private static readonly missingErrorMessage: string =
    "Rive source file or data buffer required";

  // Error message for removed rive file
  private static readonly cleanupErrorMessage: string =
    "Attempt to use file after calling cleanup.";

  private shouldDisableRiveListeners = false;

  private automaticallyHandleEvents = false;

  // Allow the runtime to automatically load assets hosted in Rive's runtime.
  private enableRiveAssetCDN = true;

  // Keep a local value of the set volume to update it asynchronously
  private _volume = 1;

  // Keep a local value of the set width to update it asynchronously
  private _artboardWidth: number | undefined = undefined;

  // Keep a local value of the set height to update it asynchronously
  private _artboardHeight: number | undefined = undefined;

  // Keep a local value of the device pixel ratio used in rendering and canvas/artboard resizing
  private _devicePixelRatioUsed = 1;

  // Whether the canvas element's size is 0
  private _hasZeroSize = false;

  // Audio event listener
  private _audioEventListener: EventListener | null = null;

  // draw method bound to the class
  private _boundDraw: (t: number) => void | null = null;

  private _viewModelInstance: ViewModelInstance | null = null;
  private _dataEnums: DataEnum[] | null = null;

  // Durations to generate a frame for the last second. Used for performance profiling.
  public durations: number[] = [];
  public frameTimes: number[] = [];
  public frameCount = 0;
  public isTouchScrollEnabled = false;

  constructor(params: RiveParameters) {
    this._boundDraw = this.draw.bind(this);
    this.canvas = params.canvas;
    if (params.canvas.constructor === HTMLCanvasElement) {
      this._observed = observers.add(
        this.canvas as HTMLCanvasElement,
        this.onCanvasResize,
      );
    }
    this.src = params.src;
    this.buffer = params.buffer;
    this.riveFile = params.riveFile;
    this.layout = params.layout ?? new Layout();
    this.shouldDisableRiveListeners = !!params.shouldDisableRiveListeners;
    this.isTouchScrollEnabled = !!params.isTouchScrollEnabled;
    this.automaticallyHandleEvents = !!params.automaticallyHandleEvents;
    this.enableRiveAssetCDN =
      params.enableRiveAssetCDN === undefined
        ? true
        : params.enableRiveAssetCDN;

    // New event management system
    this.eventManager = new EventManager();
    if (params.onLoad) this.on(EventType.Load, params.onLoad);
    if (params.onLoadError) this.on(EventType.LoadError, params.onLoadError);
    if (params.onPlay) this.on(EventType.Play, params.onPlay);
    if (params.onPause) this.on(EventType.Pause, params.onPause);
    if (params.onStop) this.on(EventType.Stop, params.onStop);
    if (params.onLoop) this.on(EventType.Loop, params.onLoop);
    if (params.onStateChange)
      this.on(EventType.StateChange, params.onStateChange);
    if (params.onAdvance) this.on(EventType.Advance, params.onAdvance);

    /**
     * @deprecated Use camelCase'd versions instead.
     */
    if (params.onload && !params.onLoad) this.on(EventType.Load, params.onload);
    if (params.onloaderror && !params.onLoadError)
      this.on(EventType.LoadError, params.onloaderror);
    if (params.onplay && !params.onPlay) this.on(EventType.Play, params.onplay);
    if (params.onpause && !params.onPause)
      this.on(EventType.Pause, params.onpause);
    if (params.onstop && !params.onStop) this.on(EventType.Stop, params.onstop);
    if (params.onloop && !params.onLoop) this.on(EventType.Loop, params.onloop);
    if (params.onstatechange && !params.onStateChange)
      this.on(EventType.StateChange, params.onstatechange);

    /**
     * Asset loading
     */
    if (params.assetLoader) this.assetLoader = params.assetLoader;

    // Hook up the task queue
    this.taskQueue = new TaskQueueManager(this.eventManager);

    this.init({
      src: this.src,
      buffer: this.buffer,
      riveFile: this.riveFile,
      autoplay: params.autoplay,
      autoBind: params.autoBind,
      animations: params.animations,
      stateMachines: params.stateMachines,
      artboard: params.artboard,
      useOffscreenRenderer: params.useOffscreenRenderer,
    });
  }

  public get viewModelCount(): number {
    return this.file.viewModelCount();
  }

  // Alternative constructor to build a Rive instance from an interface/object
  public static new(params: RiveParameters): Rive {
    console.warn(
      "This function is deprecated: please use `new Rive({})` instead",
    );
    return new Rive(params);
  }

  // Event handler for when audio context becomes available
  private onSystemAudioChanged() {
    this.volume = this._volume;
  }

  private onCanvasResize = (hasZeroSize: boolean) => {
    const toggledDisplay = this._hasZeroSize !== hasZeroSize;
    this._hasZeroSize = hasZeroSize;
    if (!hasZeroSize) {
      if (toggledDisplay) {
        this.resizeDrawingSurfaceToCanvas();
      }
    } else if (!this._layout.maxX || !this._layout.maxY) {
      this.resizeToCanvas();
    }
  };

  // Initializes the Rive object either from constructor or load()
  private init({
    src,
    buffer,
    riveFile,
    animations,
    stateMachines,
    artboard,
    autoplay = false,
    useOffscreenRenderer = false,
    autoBind = false,
  }: RiveLoadParameters): void {
    if (this.destroyed) {
      return;
    }
    this.src = src;
    this.buffer = buffer;
    this.riveFile = riveFile;

    // If no source file url specified, it's a bust
    if (!this.src && !this.buffer && !this.riveFile) {
      throw new RiveError(Rive.missingErrorMessage);
    }

    // List of animations that should be initialized.
    const startingAnimationNames = mapToStringArray(animations);

    // List of state machines that should be initialized
    const startingStateMachineNames = mapToStringArray(stateMachines);

    // Ensure loaded is marked as false if loading new file
    this.loaded = false;
    this.readyForPlaying = false;

    // Ensure the runtime is loaded
    RuntimeLoader.awaitInstance()
      .then((runtime) => {
        if (this.destroyed) {
          return;
        }
        this.runtime = runtime;

        this.removeRiveListeners();
        this.deleteRiveRenderer();

        // Get the canvas where you want to render the animation and create a renderer
        this.renderer = this.runtime.makeRenderer(
          this.canvas,
          useOffscreenRenderer,
        );

        // Initial size adjustment based on devicePixelRatio if no width/height are
        // specified explicitly
        if (!(this.canvas.width || this.canvas.height)) {
          this.resizeDrawingSurfaceToCanvas();
        }

        // Load Rive data from a source uri or a data buffer
        this.initData(
          artboard,
          startingAnimationNames,
          startingStateMachineNames,
          autoplay,
          autoBind,
        )
          .then((hasInitialized: boolean) => {
            if (hasInitialized) {
              return this.setupRiveListeners();
            }
          })
          .catch((e) => {
            console.error(e);
          });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  /**
   * Setup Rive Listeners on the canvas
   * @param riveListenerOptions - Enables TouchEvent events on the canvas. Set to true to allow
   * touch scrolling on the canvas element on touch-enabled devices
   * i.e. { isTouchScrollEnabled: true }
   */
  public setupRiveListeners(
    riveListenerOptions?: SetupRiveListenersOptions,
  ): void {
    if (this.eventCleanup) {
      this.eventCleanup();
    }
    if (!this.shouldDisableRiveListeners) {
      const activeStateMachines = (this.animator.stateMachines || [])
        .filter((sm) => sm.playing && this.runtime.hasListeners(sm.instance))
        .map((sm) => sm.instance);
      let touchScrollEnabledOption = this.isTouchScrollEnabled;
      if (
        riveListenerOptions &&
        "isTouchScrollEnabled" in riveListenerOptions
      ) {
        touchScrollEnabledOption = riveListenerOptions.isTouchScrollEnabled;
      }
      this.eventCleanup = registerTouchInteractions({
        canvas: this.canvas,
        artboard: this.artboard,
        stateMachines: activeStateMachines,
        renderer: this.renderer,
        rive: this.runtime,
        fit: this._layout.runtimeFit(this.runtime),
        alignment: this._layout.runtimeAlignment(this.runtime),
        isTouchScrollEnabled: touchScrollEnabledOption,
        layoutScaleFactor: this._layout.layoutScaleFactor,
      });
    }
  }

  /**
   * Remove Rive Listeners setup on the canvas
   */
  public removeRiveListeners(): void {
    if (this.eventCleanup) {
      this.eventCleanup();
      this.eventCleanup = null;
    }
  }

  /**
   * If the instance has audio and the system audio is not ready
   * we hook the instance to the audio manager
   */
  private initializeAudio() {
    // Initialize audio if needed
    if (audioManager.status == SystemAudioStatus.UNAVAILABLE) {
      if (this.artboard?.hasAudio && this._audioEventListener === null) {
        this._audioEventListener = {
          type: EventType.AudioStatusChange,
          callback: () => this.onSystemAudioChanged(),
        };
        audioManager.add(this._audioEventListener);
        audioManager.establishAudio();
      }
    }
  }

  private initArtboardSize() {
    if (!this.artboard) return;

    // Use preset values if they are not undefined
    this._artboardWidth = this.artboard.width =
      this._artboardWidth || this.artboard.width;
    this._artboardHeight = this.artboard.height =
      this._artboardHeight || this.artboard.height;
  }

  // Initializes runtime with Rive data and preps for playing.
  // Returns true for successful initialization.
  private async initData(
    artboardName: string,
    animationNames: string[],
    stateMachineNames: string[],
    autoplay: boolean,
    autoBind: boolean,
  ): Promise<boolean> {
    try {
      if (this.riveFile == null) {
        this.riveFile = new RiveFile({
          src: this.src,
          buffer: this.buffer,
          enableRiveAssetCDN: this.enableRiveAssetCDN,
          assetLoader: this.assetLoader,
        });
        await this.riveFile.init();
      }
      // Check for riveFile in case it has been cleaned up while initializing;
      if (!this.riveFile) {
        return false;
      }
      this.file = this.riveFile.getInstance();
      // Initialize and draw frame
      this.initArtboard(
        artboardName,
        animationNames,
        stateMachineNames,
        autoplay,
        autoBind,
      );

      // Initialize the artboard size
      this.initArtboardSize();

      // Check for audio
      this.initializeAudio();

      // Everything's set up, emit a load event
      this.loaded = true;
      this.eventManager.fire({
        type: EventType.Load,
        data: this.src ?? "buffer",
      });

      // Flag ready for playback commands and clear the task queue; this order
      // is important or it may infinitely recurse
      this.readyForPlaying = true;
      this.taskQueue.process();

      this.drawFrame();

      return true;
    } catch (error) {
      const msg = resolveErrorMessage(error);
      console.warn(msg);
      this.eventManager.fire({ type: EventType.LoadError, data: msg });
      return Promise.reject(msg);
    }
  }

  // Initialize for playback
  private initArtboard(
    artboardName: string,
    animationNames: string[],
    stateMachineNames: string[],
    autoplay: boolean,
    autoBind: boolean,
  ): void {
    if (!this.file) {
      return;
    }
    // Fetch the artboard
    const rootArtboard = artboardName
      ? this.file.artboardByName(artboardName)
      : this.file.defaultArtboard();

    // Check we have a working artboard
    if (!rootArtboard) {
      const msg = "Invalid artboard name or no default artboard";
      console.warn(msg);
      this.eventManager.fire({ type: EventType.LoadError, data: msg });
      return;
    }

    this.artboard = rootArtboard;
    rootArtboard.volume = this._volume * audioManager.systemVolume;

    // Check that the artboard has at least 1 animation
    if (this.artboard.animationCount() < 1) {
      const msg = "Artboard has no animations";
      this.eventManager.fire({ type: EventType.LoadError, data: msg });
      throw msg;
    }

    // Initialize the animator
    this.animator = new Animator(
      this.runtime,
      this.artboard,
      this.eventManager,
    );

    // Initialize the animations; as loaded hasn't happened yet, we need to
    // suppress firing the play/pause events until the load event has fired. To
    // do this we tell the animator to suppress firing events, and add event
    // firing to the task queue.
    let instanceNames: string[];
    if (animationNames.length > 0 || stateMachineNames.length > 0) {
      instanceNames = animationNames.concat(stateMachineNames);
      this.animator.initLinearAnimations(animationNames, autoplay);
      this.animator.initStateMachines(stateMachineNames, autoplay);
    } else {
      instanceNames = [this.animator.atLeastOne(autoplay, false)];
    }
    // Queue up firing the playback events
    this.taskQueue.add({
      event: {
        type: autoplay ? EventType.Play : EventType.Pause,
        data: instanceNames,
      },
    });

    if (autoBind) {
      const viewModel = this.file.defaultArtboardViewModel(rootArtboard);
      if (viewModel !== null) {
        const runtimeInstance = viewModel.defaultInstance();
        if (runtimeInstance !== null) {
          const viewModelInstance = new ViewModelInstance(
            runtimeInstance,
            null,
          );
          this.bindViewModelInstance(viewModelInstance);
        }
      }
    }
  }

  // Draws the current artboard frame
  public drawFrame() {
    if (document?.timeline?.currentTime) {
      if (this.loaded && this.artboard && !this.frameRequestId) {
        this._boundDraw(document!.timeline!.currentTime as number);
        this.runtime?.resolveAnimationFrame();
      }
    } else {
      this.startRendering();
    }
  }

  // Tracks the last timestamp at which the animation was rendered. Used only in
  // draw().
  private lastRenderTime: number;

  // Tracks the current animation frame request
  private frameRequestId: number | null;

  /**
   * Used be draw to track when a second of active rendering time has passed.
   * Used for debugging purposes
   */
  private renderSecondTimer = 0;

  /**
   * Draw rendering loop; renders animation frames at the correct time interval.
   * @param time the time at which to render a frame
   */
  private draw(time: number, onSecond?: VoidCallback): void {
    // Clear the frameRequestId, as we're now rendering a fresh frame
    this.frameRequestId = null;

    const before = performance.now();

    // On the first pass, make sure lastTime has a valid value
    if (!this.lastRenderTime) {
      this.lastRenderTime = time;
    }

    // Handle the onSecond callback
    this.renderSecondTimer += time - this.lastRenderTime;
    if (this.renderSecondTimer > 5000) {
      this.renderSecondTimer = 0;
      onSecond?.();
    }

    // Calculate the elapsed time between frames in seconds
    const elapsedTime = (time - this.lastRenderTime) / 1000;
    this.lastRenderTime = time;

    // - Advance non-paused animations by the elapsed number of seconds
    // - Advance any animations that require scrubbing
    // - Advance to the first frame even when autoplay is false
    const activeAnimations = this.animator.animations
      .filter((a) => a.playing || a.needsScrub)
      // The scrubbed animations must be applied first to prevent weird artifacts
      // if the playing animations conflict with the scrubbed animating attribuates.
      .sort((first) => (first.needsScrub ? -1 : 1));
    for (const animation of activeAnimations) {
      animation.advance(elapsedTime);
      if (animation.instance.didLoop) {
        animation.loopCount += 1;
      }
      animation.apply(1.0);
    }

    // - Advance non-paused state machines by the elapsed number of seconds
    // - Advance to the first frame even when autoplay is false
    const activeStateMachines = this.animator.stateMachines.filter(
      (a) => a.playing,
    );
    for (const stateMachine of activeStateMachines) {
      // Check for events before the current frame's state machine advance
      const numEventsReported = stateMachine.reportedEventCount();
      if (numEventsReported) {
        for (let i = 0; i < numEventsReported; i++) {
          const event = stateMachine.reportedEventAt(i);

          if (event) {
            if (event.type === RiveEventType.OpenUrl) {
              this.eventManager.fire({
                type: EventType.RiveEvent,
                data: event as rc.OpenUrlEvent,
              });
              // Handle the event side effect if explicitly enabled
              if (this.automaticallyHandleEvents) {
                const newAnchorTag = document.createElement("a");
                const { url, target } = event as rc.OpenUrlEvent;

                const sanitizedUrl = sanitizeUrl(url);
                url && newAnchorTag.setAttribute("href", sanitizedUrl);
                target && newAnchorTag.setAttribute("target", target);
                if (sanitizedUrl && sanitizedUrl !== BLANK_URL) {
                  newAnchorTag.click();
                }
              }
            } else {
              this.eventManager.fire({
                type: EventType.RiveEvent,
                data: event as rc.RiveEvent,
              });
            }
          }
        }
      }
      stateMachine.advanceAndApply(elapsedTime);
      // stateMachine.instance.apply(this.artboard);
    }

    // Once the animations have been applied to the artboard, advance it
    // by the elapsed time.
    if (this.animator.stateMachines.length == 0) {
      this.artboard.advance(elapsedTime);
    }

    const { renderer } = this;
    // Canvas must be wiped to prevent artifacts
    renderer.clear();
    renderer.save();

    // Update the renderer alignment if necessary
    this.alignRenderer();

    // Do not draw on 0 canvas size
    if (!this._hasZeroSize) {
      this.artboard.draw(renderer);
    }

    renderer.restore();
    renderer.flush();

    // Check for any animations that looped
    this.animator.handleLooping();

    // Check for any state machines that had a state change
    this.animator.handleStateChanges();

    // Report advanced time
    this.animator.handleAdvancing(elapsedTime);

    // Add duration to create frame to durations array
    this.frameCount++;
    const after = performance.now();
    this.frameTimes.push(after);
    this.durations.push(after - before);
    while (this.frameTimes[0] <= after - 1000) {
      this.frameTimes.shift();
      this.durations.shift();
    }

    this._viewModelInstance?.handleCallbacks();

    // Calling requestAnimationFrame will rerun draw() at the correct rate:
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations
    if (this.animator.isPlaying) {
      // Request a new rendering frame
      this.startRendering();
    } else if (this.animator.isPaused) {
      // Reset the end time so on playback it starts at the correct frame
      this.lastRenderTime = 0;
    } else if (this.animator.isStopped) {
      // Reset animation instances, artboard and time
      // TODO: implement this properly when we have instancing
      // this.initArtboard();
      // this.drawFrame();
      this.lastRenderTime = 0;
    }
  }

  /**
   * Align the renderer
   */
  private alignRenderer(): void {
    const { renderer, runtime, _layout, artboard } = this;
    // Align things up safe in the knowledge we can restore if changed
    renderer.align(
      _layout.runtimeFit(runtime),
      _layout.runtimeAlignment(runtime),
      {
        minX: _layout.minX,
        minY: _layout.minY,
        maxX: _layout.maxX,
        maxY: _layout.maxY,
      },
      artboard.bounds,
      this._devicePixelRatioUsed * _layout.layoutScaleFactor,
    );
  }

  public get fps() {
    return this.durations.length;
  }

  public get frameTime() {
    if (this.durations.length === 0) {
      return 0;
    }
    return (
      this.durations.reduce((a, b) => a + b, 0) / this.durations.length
    ).toFixed(4);
  }

  /**
   * Cleans up all Wasm-generated objects that need to be manually destroyed:
   * artboard instances, animation instances, state machine instances,
   * renderer instance, file and runtime.
   *
   * Once this is called, you will need to initialise a new instance of the
   * Rive class
   */
  public cleanup() {
    this.destroyed = true;
    // Stop the renderer if it hasn't already been stopped.
    this.stopRendering();
    // Clean up any artboard, animation or state machine instances.
    this.cleanupInstances();
    // Remove from observer
    if (this._observed !== null) {
      observers.remove(this._observed);
    }
    this.removeRiveListeners();
    if (this.file) {
      this.riveFile?.cleanup();
      this.file = null;
    }
    this.riveFile = null;
    this.deleteRiveRenderer();
    if (this._audioEventListener !== null) {
      audioManager.remove(this._audioEventListener);
      this._audioEventListener = null;
    }
    this._viewModelInstance?.cleanup();
    this._viewModelInstance = null;
    this._dataEnums = null;
  }

  /**
   * Cleans up the Renderer object. Only call this API if you no longer
   * need to render Rive content in your session.
   */
  public deleteRiveRenderer() {
    this.renderer?.delete();
    this.renderer = null;
  }

  /**
   * Cleans up any Wasm-generated objects that need to be manually destroyed:
   * artboard instances, animation instances, state machine instances.
   *
   * Once this is called, things will need to be reinitialized or bad things
   * might happen.
   */
  public cleanupInstances() {
    if (this.eventCleanup !== null) {
      this.eventCleanup();
    }
    // Delete all animation and state machine instances
    this.stop();
    if (this.artboard) {
      this.artboard.delete();
      this.artboard = null;
    }
  }

  /**
   * Tries to query the setup Artboard for a text run node with the given name.
   *
   * @param textRunName - Name of the text run node associated with a text object
   * @returns - TextValueRun node or undefined if the text run cannot be queried
   */
  private retrieveTextRun(textRunName: string): rc.TextValueRun | undefined {
    if (!textRunName) {
      console.warn("No text run name provided");
      return;
    }
    if (!this.artboard) {
      console.warn("Tried to access text run, but the Artboard is null");
      return;
    }
    const textRun: rc.TextValueRun = this.artboard.textRun(textRunName);
    if (!textRun) {
      console.warn(
        `Could not access a text run with name '${textRunName}' in the '${this.artboard?.name}' Artboard. Note that you must rename a text run node in the Rive editor to make it queryable at runtime.`,
      );
      return;
    }
    return textRun;
  }

  /**
   * Returns a string from a given text run node name, or undefined if the text run
   * cannot be queried.
   *
   * @param textRunName - Name of the text run node associated with a text object
   * @returns - String value of the text run node or undefined
   */
  public getTextRunValue(textRunName: string): string | undefined {
    const textRun = this.retrieveTextRun(textRunName);
    return textRun ? textRun.text : undefined;
  }

  /**
   * Sets a text value for a given text run node name if possible
   *
   * @param textRunName - Name of the text run node associated with a text object
   * @param textRunValue - String value to set on the text run node
   */
  public setTextRunValue(textRunName: string, textRunValue: string): void {
    const textRun = this.retrieveTextRun(textRunName);
    if (textRun) {
      textRun.text = textRunValue;
    }
  }

  // Plays specified animations; if none specified, it unpauses everything.
  public play(animationNames?: string | string[], autoplay?: true): void {
    animationNames = mapToStringArray(animationNames);

    // If the file's not loaded, queue up the play
    if (!this.readyForPlaying) {
      this.taskQueue.add({
        action: () => this.play(animationNames, autoplay),
      });
      return;
    }
    this.animator.play(animationNames);
    if (this.eventCleanup) {
      this.eventCleanup();
    }
    this.setupRiveListeners();
    this.startRendering();
  }

  // Pauses specified animations; if none specified, pauses all.
  public pause(animationNames?: string | string[]): void {
    animationNames = mapToStringArray(animationNames);

    // If the file's not loaded, early out, nothing to pause
    if (!this.readyForPlaying) {
      this.taskQueue.add({
        action: () => this.pause(animationNames),
      });
      return;
    }
    if (this.eventCleanup) {
      this.eventCleanup();
    }
    this.animator.pause(animationNames);
  }

  public scrub(animationNames?: string | string[], value?: number): void {
    animationNames = mapToStringArray(animationNames);

    // If the file's not loaded, early out, nothing to pause
    if (!this.readyForPlaying) {
      this.taskQueue.add({
        action: () => this.scrub(animationNames, value),
      });
      return;
    }

    // Scrub the animation time; we draw a single frame here so that if
    // nothing's currently playing, the scrubbed animation is still rendered/
    this.animator.scrub(animationNames, value || 0);
    this.drawFrame();
  }

  // Stops specified animations; if none specifies, stops them all.
  public stop(animationNames?: string | string[] | undefined): void {
    animationNames = mapToStringArray(animationNames);
    // If the file's not loaded, early out, nothing to pause
    if (!this.readyForPlaying) {
      this.taskQueue.add({
        action: () => this.stop(animationNames),
      });
      return;
    }
    // If there is no artboard, this.animator will be undefined
    if (this.animator) {
      this.animator.stop(animationNames);
    }
    if (this.eventCleanup) {
      this.eventCleanup();
    }
  }

  /**
   * Resets the animation
   * @param artboard the name of the artboard, or default if none given
   * @param animations the names of animations for playback
   * @param stateMachines the names of state machines for playback
   * @param autoplay whether to autoplay when reset, defaults to false
   *
   */
  public reset(params?: RiveResetParameters): void {
    // Get the current artboard, animations, state machines, and playback states
    const artBoardName = params?.artboard;
    const animationNames = mapToStringArray(params?.animations);
    const stateMachineNames = mapToStringArray(params?.stateMachines);
    const autoplay = params?.autoplay ?? false;
    const autoBind = params?.autoBind ?? false;

    // Stop everything and clean up
    this.cleanupInstances();

    // Reinitialize an artboard instance with the state
    this.initArtboard(
      artBoardName,
      animationNames,
      stateMachineNames,
      autoplay,
      autoBind,
    );
    this.taskQueue.process();
  }

  // Loads a new Rive file, keeping listeners in place
  public load(params: RiveLoadParameters): void {
    this.file = null;
    // Stop all animations
    this.stop();
    // Reinitialize
    this.init(params);
  }

  // Sets a new layout
  public set layout(layout: Layout) {
    this._layout = layout;
    // If the maxX or maxY are 0, then set them to the canvas width and height
    if (!layout.maxX || !layout.maxY) {
      this.resizeToCanvas();
    }
    if (this.loaded && !this.animator.isPlaying) {
      this.drawFrame();
    }
  }

  /**
   * Returns the current layout. Note that layout should be treated as
   * immutable. If you want to change the layout, create a new one use the
   * layout setter
   */
  public get layout() {
    return this._layout;
  }

  /**
   * Sets the layout bounds to the current canvas size; this is typically called
   * when the canvas is resized
   */
  public resizeToCanvas() {
    this._layout = this.layout.copyWith({
      minX: 0,
      minY: 0,
      maxX: this.canvas.width,
      maxY: this.canvas.height,
    });
  }

  /**
   * Accounts for devicePixelRatio as a multiplier to render the size of the canvas drawing surface.
   * Uses the size of the backing canvas to set new width/height attributes. Need to re-render
   * and resize the layout to match the new drawing surface afterwards.
   * Useful function for consumers to include in a window resize listener.
   *
   * This method will set the {@link devicePixelRatioUsed} property.
   *
   * Optionally, you can provide a {@link customDevicePixelRatio} to provide a
   * custom value.
   */
  public resizeDrawingSurfaceToCanvas(customDevicePixelRatio?: number) {
    if (this.canvas instanceof HTMLCanvasElement && !!window) {
      const { width, height } = this.canvas.getBoundingClientRect();
      const dpr = customDevicePixelRatio || window.devicePixelRatio || 1;
      this.devicePixelRatioUsed = dpr;
      this.canvas.width = dpr * width;
      this.canvas.height = dpr * height;
      this.resizeToCanvas();
      this.drawFrame();

      if (this.layout.fit === Fit.Layout) {
        const scaleFactor = this._layout.layoutScaleFactor;
        this.artboard.width = width / scaleFactor;
        this.artboard.height = height / scaleFactor;
      }
    }
  }

  // Returns the animation source, which may be undefined
  public get source(): string {
    return this.src;
  }

  /**
   * Returns the name of the active artboard
   */
  public get activeArtboard(): string {
    return this.artboard ? this.artboard.name : "";
  }

  // Returns a list of animation names on the chosen artboard
  public get animationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded || !this.artboard) {
      return [];
    }
    const animationNames: string[] = [];
    for (let i = 0; i < this.artboard.animationCount(); i++) {
      animationNames.push(this.artboard.animationByIndex(i).name);
    }
    return animationNames;
  }

  /**
   * Returns a list of state machine names from the current artboard
   */
  public get stateMachineNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded || !this.artboard) {
      return [];
    }
    const stateMachineNames: string[] = [];
    for (let i = 0; i < this.artboard.stateMachineCount(); i++) {
      stateMachineNames.push(this.artboard.stateMachineByIndex(i).name);
    }
    return stateMachineNames;
  }

  /**
   * Returns the inputs for the specified instanced state machine, or an empty
   * list if the name is invalid or the state machine is not instanced
   * @param name the state machine name
   * @returns the inputs for the named state machine
   */
  public stateMachineInputs(name: string): StateMachineInput[] {
    // If the file's not loaded, early out, nothing to pause
    if (!this.loaded) {
      return;
    }
    const stateMachine = this.animator.stateMachines.find(
      (m) => m.name === name,
    );
    return stateMachine?.inputs;
  }

  // Returns the input with the provided name at the given path
  private retrieveInputAtPath(
    name: string,
    path: string,
  ): rc.SMIInput | undefined {
    if (!name) {
      console.warn(`No input name provided for path '${path}'`);
      return;
    }
    if (!this.artboard) {
      console.warn(
        `Tried to access input: '${name}', at path: '${path}', but the Artboard is null`,
      );
      return;
    }
    const input: rc.SMIInput = this.artboard.inputByPath(name, path);

    if (!input) {
      console.warn(
        `Could not access an input with name: '${name}', at path:'${path}'`,
      );
      return;
    }
    return input;
  }

  /**
   * Set the boolean input with the provided name at the given path with value
   * @param input the state machine input name
   * @param value the value to set the input to
   * @param path the path the input is located at an artboard level
   */
  public setBooleanStateAtPath(
    inputName: string,
    value: boolean,
    path: string,
  ) {
    const input: rc.SMIInput = this.retrieveInputAtPath(inputName, path);
    if (!input) return;

    if (input.type === StateMachineInputType.Boolean) {
      input.asBool().value = value;
    } else {
      console.warn(
        `Input with name: '${inputName}', at path:'${path}' is not a boolean`,
      );
    }
  }

  /**
   * Set the number input with the provided name at the given path with value
   * @param input the state machine input name
   * @param value the value to set the input to
   * @param path the path the input is located at an artboard level
   */
  public setNumberStateAtPath(inputName: string, value: number, path: string) {
    const input: rc.SMIInput = this.retrieveInputAtPath(inputName, path);
    if (!input) return;

    if (input.type === StateMachineInputType.Number) {
      input.asNumber().value = value;
    } else {
      console.warn(
        `Input with name: '${inputName}', at path:'${path}' is not a number`,
      );
    }
  }

  /**
   * Fire the trigger with the provided name at the given path
   * @param input the state machine input name
   * @param path the path the input is located at an artboard level
   */
  public fireStateAtPath(inputName: string, path: string) {
    const input: rc.SMIInput = this.retrieveInputAtPath(inputName, path);
    if (!input) return;

    if (input.type === StateMachineInputType.Trigger) {
      input.asTrigger().fire();
    } else {
      console.warn(
        `Input with name: '${inputName}', at path:'${path}' is not a trigger`,
      );
    }
  }

  // Returns the TextValueRun object for the provided name at the given path
  private retrieveTextAtPath(
    name: string,
    path: string,
  ): rc.TextValueRun | undefined {
    if (!name) {
      console.warn(`No text name provided for path '${path}'`);
      return;
    }
    if (!path) {
      console.warn(`No path provided for text '${name}'`);
      return;
    }
    if (!this.artboard) {
      console.warn(
        `Tried to access text: '${name}', at path: '${path}', but the Artboard is null`,
      );
      return;
    }
    const text: rc.TextValueRun = this.artboard.textByPath(name, path);
    if (!text) {
      console.warn(
        `Could not access text with name: '${name}', at path:'${path}'`,
      );
      return;
    }
    return text;
  }

  /**
   * Retrieves the text value for a specified text run at a given path
   * @param textName The name of the text run
   * @param path The path to the text run within the artboard
   * @returns The text value of the text run, or undefined if not found
   *
   * @example
   * // Get the text value for a text run named "title" at one nested artboard deep
   * const titleText = riveInstance.getTextRunValueAtPath("title", "artboard1");
   *
   * @example
   * // Get the text value for a text run named "subtitle" within a nested group two artboards deep
   * const subtitleText = riveInstance.getTextRunValueAtPath("subtitle", "group/nestedGroup");
   *
   * @remarks
   * If the text run cannot be found at the specified path, a warning will be logged to the console.
   */
  public getTextRunValueAtPath(
    textName: string,
    path: string,
  ): string | undefined {
    const run: rc.TextValueRun = this.retrieveTextAtPath(textName, path);
    if (!run) {
      console.warn(
        `Could not get text with name: '${textName}', at path:'${path}'`,
      );
      return;
    }
    return run.text;
  }

  /**
   * Sets the text value for a specified text run at a given path
   * @param textName The name of the text run
   * @param value The new text value to set
   * @param path The path to the text run within the artboard
   * @returns void
   *
   * @example
   * // Set the text value for a text run named "title" at one nested artboard deep
   * riveInstance.setTextRunValueAtPath("title", "New Title", "artboard1");
   *
   * @example
   * // Set the text value for a text run named "subtitle" within a nested group two artboards deep
   * riveInstance.setTextRunValueAtPath("subtitle", "New Subtitle", "group/nestedGroup");
   *
   * @remarks
   * If the text run cannot be found at the specified path, a warning will be logged to the console.
   */
  public setTextRunValueAtPath(textName: string, value: string, path: string) {
    const run: rc.TextValueRun = this.retrieveTextAtPath(textName, path);
    if (!run) {
      console.warn(
        `Could not set text with name: '${textName}', at path:'${path}'`,
      );
      return;
    }
    run.text = value;
  }

  // Returns a list of playing machine names
  public get playingStateMachineNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animator.stateMachines
      .filter((m) => m.playing)
      .map((m) => m.name);
  }

  // Returns a list of playing animation names
  public get playingAnimationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animator.animations.filter((a) => a.playing).map((a) => a.name);
  }

  // Returns a list of paused animation names
  public get pausedAnimationNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animator.animations
      .filter((a) => !a.playing)
      .map((a) => a.name);
  }

  /**
   *  Returns a list of paused machine names
   * @returns a list of state machine names that are paused
   */
  public get pausedStateMachineNames(): string[] {
    // If the file's not loaded, we got nothing to return
    if (!this.loaded) {
      return [];
    }
    return this.animator.stateMachines
      .filter((m) => !m.playing)
      .map((m) => m.name);
  }

  /**
   * @returns true if any animation is playing
   */
  public get isPlaying(): boolean {
    return this.animator.isPlaying;
  }

  /**
   * @returns true if all instanced animations are paused
   */
  public get isPaused(): boolean {
    return this.animator.isPaused;
  }

  /**
   * @returns true if no animations are playing or paused
   */
  public get isStopped(): boolean {
    return this.animator.isStopped;
  }

  /**
   * @returns the bounds of the current artboard, or undefined if the artboard
   * isn't loaded yet.
   */
  public get bounds(): Bounds {
    return this.artboard ? this.artboard.bounds : undefined;
  }

  /**
   * Subscribe to Rive-generated events
   * @param type the type of event to subscribe to
   * @param callback callback to fire when the event occurs
   */
  public on(type: EventType, callback: EventCallback) {
    this.eventManager.add({
      type: type,
      callback: callback,
    });
  }

  /**
   * Unsubscribes from a Rive-generated event
   * @param type the type of event to unsubscribe from
   * @param callback the callback to unsubscribe
   */
  public off(type: EventType, callback: EventCallback) {
    this.eventManager.remove({
      type: type,
      callback: callback,
    });
  }

  /**
   * Unsubscribes from a Rive-generated event
   * @deprecated
   * @param callback the callback to unsubscribe from
   */
  public unsubscribe(type: EventType, callback: EventCallback) {
    console.warn("This function is deprecated: please use `off()` instead.");
    this.off(type, callback);
  }

  /**
   * Unsubscribes all Rive listeners from an event type, or everything if no type is
   * given
   * @param type the type of event to unsubscribe from, or all types if
   * undefined
   */
  public removeAllRiveEventListeners(type?: EventType) {
    this.eventManager.removeAll(type);
  }

  /**
   * Unsubscribes all listeners from an event type, or everything if no type is
   * given
   * @deprecated
   * @param type the type of event to unsubscribe from, or all types if
   * undefined
   */
  public unsubscribeAll(type?: EventType) {
    console.warn(
      "This function is deprecated: please use `removeAllRiveEventListeners()` instead.",
    );
    this.removeAllRiveEventListeners(type);
  }

  /**
   * Stops the rendering loop; this is different from pausing in that it doesn't
   * change the state of any animation. It stops rendering from occurring. This
   * is designed for situations such as when Rive isn't visible.
   *
   * The only way to start rendering again is to call `startRendering`.
   * Animations that are marked as playing will start from the position that
   * they would have been at if rendering had not been stopped.
   */
  public stopRendering() {
    if (this.loaded && this.frameRequestId) {
      if (this.runtime.cancelAnimationFrame) {
        this.runtime.cancelAnimationFrame(this.frameRequestId);
      } else {
        cancelAnimationFrame(this.frameRequestId);
      }
      this.frameRequestId = null;
    }
  }

  /**
   * Starts the rendering loop if it has been previously stopped. If the
   * renderer is already active, then this will have zero effect.
   */
  public startRendering() {
    if (this.loaded && this.artboard && !this.frameRequestId) {
      if (this.runtime.requestAnimationFrame) {
        this.frameRequestId = this.runtime.requestAnimationFrame(
          this._boundDraw,
        );
      } else {
        this.frameRequestId = requestAnimationFrame(this._boundDraw);
      }
    }
  }

  /**
   * Enables frames-per-second (FPS) reporting for the runtime
   * If no callback is provided, Rive will append a fixed-position div at the top-right corner of
   * the page with the FPS reading
   * @param fpsCallback - Callback from the runtime during the RAF loop that supplies the FPS value
   */
  public enableFPSCounter(fpsCallback?: FPSCallback) {
    this.runtime.enableFPSCounter(fpsCallback);
  }

  /**
   * Disables frames-per-second (FPS) reporting for the runtime
   */
  public disableFPSCounter() {
    this.runtime.disableFPSCounter();
  }

  /**
   * Returns the contents of a Rive file: the artboards, animations, and state machines
   */
  public get contents(): RiveFileContents {
    if (!this.loaded) {
      return undefined;
    }
    const riveContents: RiveFileContents = {
      artboards: [],
    };
    for (let i = 0; i < this.file.artboardCount(); i++) {
      const artboard = this.file.artboardByIndex(i);
      const artboardContents: ArtboardContents = {
        name: artboard.name,
        animations: [],
        stateMachines: [],
      };
      for (let j = 0; j < artboard.animationCount(); j++) {
        const animation = artboard.animationByIndex(j);
        artboardContents.animations.push(animation.name);
      }
      for (let k = 0; k < artboard.stateMachineCount(); k++) {
        const stateMachine = artboard.stateMachineByIndex(k);
        const name = stateMachine.name;
        const instance = new this.runtime.StateMachineInstance(
          stateMachine,
          artboard,
        );
        const inputContents: StateMachineInputContents[] = [];
        for (let l = 0; l < instance.inputCount(); l++) {
          const input = instance.input(l);
          inputContents.push({ name: input.name, type: input.type });
        }
        artboardContents.stateMachines.push({
          name: name,
          inputs: inputContents,
        });
      }
      riveContents.artboards.push(artboardContents);
    }
    return riveContents;
  }

  /**
   * Getter / Setter for the volume of the artboard
   */
  public get volume(): number {
    if (this.artboard && this.artboard.volume !== this._volume) {
      this._volume = this.artboard.volume;
    }
    return this._volume;
  }

  public set volume(value: number) {
    this._volume = value;
    if (this.artboard) {
      this.artboard.volume = value * audioManager.systemVolume;
    }
  }

  /**
   * The width of the artboard.
   *
   * This will return 0 if the artboard is not loaded yet and a custom
   * width has not been set.
   *
   * Do not set this value manually when using {@link resizeDrawingSurfaceToCanvas}
   * with a {@link Layout.fit} of {@link Fit.Layout}, as the artboard width is
   * automatically set.
   */
  public get artboardWidth(): number {
    if (this.artboard) {
      return this.artboard.width;
    }
    return this._artboardWidth ?? 0;
  }

  public set artboardWidth(value: number) {
    this._artboardWidth = value;
    if (this.artboard) {
      this.artboard.width = value;
    }
  }

  /**
   * The height of the artboard.
   *
   * This will return 0 if the artboard is not loaded yet and a custom
   * height has not been set.
   *
   * Do not set this value manually when using {@link resizeDrawingSurfaceToCanvas}
   * with a {@link Layout.fit} of {@link Fit.Layout}, as the artboard height is
   * automatically set.
   */
  public get artboardHeight(): number {
    if (this.artboard) {
      return this.artboard.height;
    }
    return this._artboardHeight ?? 0;
  }

  public set artboardHeight(value: number) {
    this._artboardHeight = value;

    if (this.artboard) {
      this.artboard.height = value;
    }
  }

  /**
   * Reset the artboard size to its original values.
   */
  public resetArtboardSize() {
    if (this.artboard) {
      this.artboard.resetArtboardSize();
      this._artboardWidth = this.artboard.width;
      this._artboardHeight = this.artboard.height;
    } else {
      // If the artboard isn't loaded, we need to reset the custom width and height
      this._artboardWidth = undefined;
      this._artboardHeight = undefined;
    }
  }

  /**
   * The device pixel ratio used in rendering and canvas/artboard resizing.
   *
   * This value will be overidden by the device pixel ratio used in
   * {@link resizeDrawingSurfaceToCanvas}. If you use that method, do not set this value.
   */
  public get devicePixelRatioUsed(): number {
    return this._devicePixelRatioUsed;
  }

  public set devicePixelRatioUsed(value: number) {
    this._devicePixelRatioUsed = value;
  }

  /**
   * Initialize the data context with the view model instance.
   */
  public bindViewModelInstance(viewModelInstance: ViewModelInstance | null) {
    if (this.artboard && !this.destroyed) {
      if (viewModelInstance && viewModelInstance.runtimeInstance) {
        viewModelInstance.internalIncrementReferenceCount();
        this._viewModelInstance?.cleanup();
        this._viewModelInstance = viewModelInstance;
        if (this.animator.stateMachines.length > 0) {
          this.animator.stateMachines.forEach((stateMachine) =>
            stateMachine.bindViewModelInstance(viewModelInstance),
          );
        } else {
          this.artboard.bindViewModelInstance(
            viewModelInstance.runtimeInstance,
          );
        }
      }
    }
  }

  public get viewModelInstance(): ViewModelInstance | null {
    return this._viewModelInstance;
  }

  public viewModelByIndex(index: number): ViewModel | null {
    const viewModel = this.file.viewModelByIndex(index);
    if (viewModel !== null) {
      return new ViewModel(viewModel);
    }
    return null;
  }

  public viewModelByName(name: string): ViewModel | null {
    const viewModel = this.file.viewModelByName(name);
    if (viewModel !== null) {
      return new ViewModel(viewModel);
    }
    return null;
  }

  public enums(): DataEnum[] {
    if (this._dataEnums === null) {
      const dataEnums = this.file.enums();
      this._dataEnums = dataEnums.map((dataEnum) => {
        return new DataEnum(dataEnum);
      });
    }
    return this._dataEnums;
  }

  public defaultViewModel(): ViewModel | null {
    if (this.artboard) {
      const viewModel = this.file.defaultArtboardViewModel(this.artboard);
      if (viewModel) {
        return new ViewModel(viewModel);
      }
    }
    return null;
  }
}

export class ViewModel {
  private _viewModel: rc.ViewModel;

  constructor(viewModel: rc.ViewModel) {
    this._viewModel = viewModel;
  }

  public get instanceCount(): number {
    return this._viewModel.instanceCount;
  }

  public get name(): string {
    return this._viewModel.name;
  }

  public instanceByIndex(index: number): ViewModelInstance | null {
    const instance = this._viewModel.instanceByIndex(index);
    if (instance !== null) {
      return new ViewModelInstance(instance, null);
    }
    return null;
  }

  public instanceByName(name: string): ViewModelInstance | null {
    const instance = this._viewModel.instanceByName(name);
    if (instance !== null) {
      return new ViewModelInstance(instance, null);
    }
    return null;
  }

  public defaultInstance(): ViewModelInstance | null {
    const runtimeInstance = this._viewModel.defaultInstance();
    if (runtimeInstance !== null) {
      return new ViewModelInstance(runtimeInstance, null);
    }
    return null;
  }

  public instance(): ViewModelInstance | null {
    const runtimeInstance = this._viewModel.instance();
    if (runtimeInstance !== null) {
      return new ViewModelInstance(runtimeInstance, null);
    }
    return null;
  }

  public get properties(): rc.ViewModelProperty[] {
    return this._viewModel.getProperties();
  }

  public get instanceNames(): string[] {
    return this._viewModel.getInstanceNames();
  }
}

export class DataEnum {
  private _dataEnum: rc.DataEnum;

  constructor(dataEnum: rc.DataEnum) {
    this._dataEnum = dataEnum;
  }

  public get name(): string {
    return this._dataEnum.name;
  }

  public get values(): string[] {
    return this._dataEnum.values;
  }
}

enum PropertyType {
  Number = "number",
  String = "string",
  Boolean = "boolean",
  Color = "color",
  Trigger = "trigger",
  Enum = "enum",
  List = "list",
  Image = "image",
}

export class ViewModelInstance {
  private _runtimeInstance: rc.ViewModelInstance | null;

  private _parents: ViewModelInstance[] = [];

  private _children: ViewModelInstance[] = [];

  private _viewModelInstances: Map<string, ViewModelInstance> = new Map();

  private _propertiesWithCallbacks: ViewModelInstanceValue[] = [];

  private _referenceCount = 0;

  constructor(
    runtimeInstance: rc.ViewModelInstance,
    parent: ViewModelInstance | null,
  ) {
    this._runtimeInstance = runtimeInstance;
    if (parent !== null) {
      this._parents.push(parent);
    }
  }

  public get runtimeInstance(): rc.ViewModelInstance | null {
    return this._runtimeInstance;
  }

  public handleCallbacks() {
    if (this._propertiesWithCallbacks.length !== 0) {
      this._propertiesWithCallbacks.forEach((property) => {
        property.handleCallbacks();
      });
      this._propertiesWithCallbacks.forEach((property) => {
        property.clearChanges();
      });
    }
    this._children.forEach((child) => child.handleCallbacks());
  }

  public addParent(parent: ViewModelInstance) {
    if (!this._parents.includes(parent)) {
      this._parents.push(parent);
      if (
        this._propertiesWithCallbacks.length > 0 ||
        this._children.length > 0
      ) {
        parent.addToViewModelCallbacks(this);
      }
    }
  }

  public removeParent(parent: ViewModelInstance) {
    const index = this._parents.indexOf(parent);
    if (index !== -1) {
      const parent = this._parents[index];
      parent.removeFromViewModelCallbacks(this);
      this._parents.splice(index, 1);
    }
  }

  /*
   * method for internal use, it shouldn't be called externally
   */
  public addToPropertyCallbacks(property: ViewModelInstanceValue) {
    if (!this._propertiesWithCallbacks.includes(property)) {
      this._propertiesWithCallbacks.push(property);
      if (this._propertiesWithCallbacks.length > 0) {
        this._parents.forEach((parent) => {
          parent.addToViewModelCallbacks(this);
        });
      }
    }
  }

  /*
   * method for internal use, it shouldn't be called externally
   */
  public removeFromPropertyCallbacks(property: ViewModelInstanceValue) {
    if (this._propertiesWithCallbacks.includes(property)) {
      this._propertiesWithCallbacks = this._propertiesWithCallbacks.filter(
        (prop) => prop !== property,
      );
      if (
        this._children.length === 0 &&
        this._propertiesWithCallbacks.length === 0
      ) {
        this._parents.forEach((parent) => {
          parent.removeFromViewModelCallbacks(this);
        });
      }
    }
  }

  /*
   * method for internal use, it shouldn't be called externally
   */
  public addToViewModelCallbacks(instance: ViewModelInstance) {
    if (!this._children.includes(instance)) {
      this._children.push(instance);
      this._parents.forEach((parent) => {
        parent.addToViewModelCallbacks(this);
      });
    }
  }

  /*
   * method for internal use, it shouldn't be called externally
   */
  public removeFromViewModelCallbacks(instance: ViewModelInstance) {
    if (this._children.includes(instance)) {
      this._children = this._children.filter((child) => child !== instance);
      if (
        this._children.length === 0 &&
        this._propertiesWithCallbacks.length === 0
      ) {
        this._parents.forEach((parent) => {
          parent.removeFromViewModelCallbacks(this);
        });
      }
    }
  }

  private clearCallbacks() {
    this._propertiesWithCallbacks.forEach((property) => {
      property.clearCallbacks();
    });
  }

  private propertyFromPath(
    path: string,
    type: PropertyType,
  ): ViewModelInstanceValue | null {
    const pathSegments = path.split("/");
    return this.propertyFromPathSegments(pathSegments, 0, type);
  }

  private viewModelFromPathSegments(
    pathSegments: string[],
    index: number,
  ): ViewModelInstance | null {
    const viewModelInstance = this.internalViewModelInstance(
      pathSegments[index],
    );
    if (viewModelInstance !== null) {
      if (index == pathSegments.length - 1) {
        return viewModelInstance;
      } else {
        return viewModelInstance.viewModelFromPathSegments(
          pathSegments,
          index++,
        );
      }
    }
    return null;
  }

  private propertyFromPathSegments(
    pathSegments: string[],
    index: number,
    type: PropertyType,
  ): ViewModelInstanceValue | null {
    if (index < pathSegments.length - 1) {
      const viewModelInstance = this.internalViewModelInstance(
        pathSegments[index],
      );
      if (viewModelInstance !== null) {
        return viewModelInstance.propertyFromPathSegments(
          pathSegments,
          index + 1,
          type,
        );
      } else {
        return null;
      }
    }
    let instance: rc.ViewModelInstanceValue | null = null;
    switch (type) {
      case PropertyType.Number:
        instance = this._runtimeInstance?.number(pathSegments[index]) ?? null;
        if (instance !== null) {
          return new ViewModelInstanceNumber(
            instance as rc.ViewModelInstanceNumber,
            this,
          );
        }
        break;
      case PropertyType.String:
        instance = this._runtimeInstance?.string(pathSegments[index]) ?? null;
        if (instance !== null) {
          return new ViewModelInstanceString(
            instance as rc.ViewModelInstanceString,
            this,
          );
        }
        break;
      case PropertyType.Boolean:
        instance = this._runtimeInstance?.boolean(pathSegments[index]) ?? null;
        if (instance !== null) {
          return new ViewModelInstanceBoolean(
            instance as rc.ViewModelInstanceBoolean,
            this,
          );
        }
        break;
      case PropertyType.Color:
        instance = this._runtimeInstance?.color(pathSegments[index]) ?? null;
        if (instance !== null) {
          return new ViewModelInstanceColor(
            instance as rc.ViewModelInstanceColor,
            this,
          );
        }
        break;
      case PropertyType.Trigger:
        instance = this._runtimeInstance?.trigger(pathSegments[index]) ?? null;
        if (instance !== null) {
          return new ViewModelInstanceTrigger(
            instance as rc.ViewModelInstanceTrigger,
            this,
          );
        }
        break;
      case PropertyType.Enum:
        instance = this._runtimeInstance?.enum(pathSegments[index]) ?? null;
        if (instance !== null) {
          return new ViewModelInstanceEnum(
            instance as rc.ViewModelInstanceEnum,
            this,
          );
        }
        break;
      case PropertyType.List:
        instance = this._runtimeInstance?.list(pathSegments[index]) ?? null;
        if (instance !== null) {
          return new ViewModelInstanceList(
            instance as rc.ViewModelInstanceList,
            this,
          );
        }
        break;
      case PropertyType.Image:
        instance = this._runtimeInstance?.image(pathSegments[index]) ?? null;
        if (instance !== null) {
          return new ViewModelInstanceAssetImage(
            instance as rc.ViewModelInstanceAssetImage,
            this,
          );
        }
        break;
    }
    return null;
  }

  private internalViewModelInstance(name: string): ViewModelInstance | null {
    if (this._viewModelInstances.has(name)) {
      return this._viewModelInstances.get(name)!;
    }
    const viewModelRuntimeInstance = this._runtimeInstance?.viewModel(name);
    if (viewModelRuntimeInstance !== null) {
      const viewModelInstance = new ViewModelInstance(
        viewModelRuntimeInstance!,
        this,
      );
      viewModelInstance.internalIncrementReferenceCount();
      this._viewModelInstances.set(name, viewModelInstance);
      return viewModelInstance;
    }
    return null;
  }

  /**
   * method to access a property instance of type number belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the number property
   */
  public number(path: string): ViewModelInstanceNumber | null {
    const viewmodelInstanceValue = this.propertyFromPath(
      path,
      PropertyType.Number,
    );
    return viewmodelInstanceValue as ViewModelInstanceNumber;
  }

  /**
   * method to access a property instance of type string belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the string property
   */
  public string(path: string): ViewModelInstanceString | null {
    const viewmodelInstanceValue = this.propertyFromPath(
      path,
      PropertyType.String,
    );
    return viewmodelInstanceValue as ViewModelInstanceString | null;
  }

  /**
   * method to access a property instance of type boolean belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the boolean property
   */
  public boolean(path: string): ViewModelInstanceBoolean | null {
    const viewmodelInstanceValue = this.propertyFromPath(
      path,
      PropertyType.Boolean,
    );
    return viewmodelInstanceValue as ViewModelInstanceBoolean | null;
  }

  /**
   * method to access a property instance of type color belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the ttrigger property
   */
  public color(path: string): ViewModelInstanceColor | null {
    const viewmodelInstanceValue = this.propertyFromPath(
      path,
      PropertyType.Color,
    );
    return viewmodelInstanceValue as ViewModelInstanceColor | null;
  }

  /**
   * method to access a property instance of type trigger belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the trigger property
   */
  public trigger(path: string): ViewModelInstanceTrigger | null {
    const viewmodelInstanceValue = this.propertyFromPath(
      path,
      PropertyType.Trigger,
    );
    return viewmodelInstanceValue as ViewModelInstanceTrigger | null;
  }

  /**
   * method to access a property instance of type enum belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the enum property
   */
  public enum(path: string): ViewModelInstanceEnum | null {
    const viewmodelInstanceValue = this.propertyFromPath(
      path,
      PropertyType.Enum,
    );
    return viewmodelInstanceValue as ViewModelInstanceEnum | null;
  }

  /**
   * method to access a property instance of type list belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the list property
   */
  public list(path: string): ViewModelInstanceList | null {
    const viewmodelInstanceValue = this.propertyFromPath(
      path,
      PropertyType.List,
    );
    return viewmodelInstanceValue as ViewModelInstanceList | null;
  }

  /**
   * method to access a view model property instance belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the image property
   */
  public image(path: string): ViewModelInstanceAssetImage | null {
    const viewmodelInstanceValue = this.propertyFromPath(
      path,
      PropertyType.Image,
    );
    return viewmodelInstanceValue as ViewModelInstanceAssetImage | null;
  }

  /**
   * method to access a view model property instance belonging
   * to the view model instance or to a nested view model instance
   * @param path - path to the view model property
   */
  public viewModel(path: string): ViewModelInstance | null {
    const pathSegments = path.split("/");
    const parentViewModelInstance =
      pathSegments.length > 1
        ? this.viewModelFromPathSegments(
            pathSegments.slice(0, pathSegments.length - 1),
            0,
          )
        : this;
    if (parentViewModelInstance != null) {
      return parentViewModelInstance.internalViewModelInstance(
        pathSegments[pathSegments.length - 1],
      );
    }
    return null;
  }

  public internalReplaceViewModel(
    name: string,
    value: ViewModelInstance,
  ): boolean {
    if (value.runtimeInstance !== null) {
      const result =
        this._runtimeInstance?.replaceViewModel(name, value.runtimeInstance!) ||
        false;
      if (result) {
        value.internalIncrementReferenceCount();
        const oldInstance = this.internalViewModelInstance(name);
        if (oldInstance !== null) {
          oldInstance.removeParent(this);
          if (this._children.includes(oldInstance)) {
            this._children = this._children.filter(
              (child) => child !== oldInstance,
            );
          }
          oldInstance.cleanup();
        }
        this._viewModelInstances.set(name, value);
        value.addParent(this);
      }
      return result;
    }
    return false;
  }

  /**
   * method to replace a view model property with another view model value
   * @param path - path to the view model property
   * @param value - view model that will replace the original
   */
  public replaceViewModel(path: string, value: ViewModelInstance): boolean {
    const pathSegments = path.split("/");
    const viewModelInstance =
      pathSegments.length > 1
        ? this.viewModelFromPathSegments(
            pathSegments.slice(0, pathSegments.length - 1),
            0,
          )
        : this;
    return (
      viewModelInstance?.internalReplaceViewModel(
        pathSegments[pathSegments.length - 1],
        value,
      ) ?? false
    );
  }

  /*
   * method to add one to the reference counter of the instance.
   * Use if the file owning the reference is destroyed but the instance needs to stay around
   */
  public incrementReferenceCount() {
    this._referenceCount++;
    this._runtimeInstance?.incrementReferenceCount();
  }

  /*
   * method to subtract one to the reference counter of the instance.
   * Use if incrementReferenceCount has been called
   */
  public decrementReferenceCount() {
    this._referenceCount--;
    this._runtimeInstance?.decrementReferenceCount();
  }

  public get properties(): rc.ViewModelProperty[] {
    return (
      this._runtimeInstance?.getProperties().map((prop) => ({ ...prop })) || []
    );
  }

  public internalIncrementReferenceCount() {
    this._referenceCount++;
  }

  public cleanup() {
    this._referenceCount--;
    if (this._referenceCount <= 0) {
      this._runtimeInstance = null;
      this.clearCallbacks();
      this._propertiesWithCallbacks = [];
      this._viewModelInstances.forEach((value) => {
        value.cleanup();
      });
      this._viewModelInstances.clear();
      const children = [...this._children];
      this._children.length = 0;
      const parents = [...this._parents];
      this._parents.length = 0;
      children.forEach((child) => {
        child.removeParent(this);
      });
      parents.forEach((parent) => {
        parent.removeFromViewModelCallbacks(this);
      });
    }
  }
}

export class ViewModelInstanceValue {
  protected _parentViewModel: ViewModelInstance;
  protected callbacks: EventCallback[] = [];
  protected _viewModelInstanceValue: rc.ViewModelInstanceValue;
  constructor(instance: rc.ViewModelInstanceValue, parent: ViewModelInstance) {
    this._viewModelInstanceValue = instance;
    this._parentViewModel = parent;
  }

  public on(callback: EventCallback) {
    // Since we don't clean the changed flag for properties that don't have listeners,
    // we clean it the first time we add a listener to it
    if (this.callbacks.length === 0) {
      this._viewModelInstanceValue.clearChanges();
    }
    if (!this.callbacks.includes(callback)) {
      this.callbacks.push(callback);
      this._parentViewModel.addToPropertyCallbacks(this);
    }
  }
  public off(callback?: EventCallback) {
    if (!callback) {
      this.callbacks.length = 0;
    } else {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    }
    if (this.callbacks.length === 0) {
      this._parentViewModel.removeFromPropertyCallbacks(this);
    }
  }
  public internalHandleCallback(callback: Function) {}

  public handleCallbacks() {
    if (this._viewModelInstanceValue.hasChanged) {
      this.callbacks.forEach((callback) => {
        this.internalHandleCallback(callback);
      });
    }
  }

  public clearChanges() {
    this._viewModelInstanceValue.clearChanges();
  }

  public clearCallbacks() {
    this.callbacks.length = 0;
  }

  public get name() {
    return this._viewModelInstanceValue.name;
  }
}

export class ViewModelInstanceString extends ViewModelInstanceValue {
  constructor(instance: rc.ViewModelInstanceString, parent: ViewModelInstance) {
    super(instance, parent);
  }

  public get value(): string {
    return (this._viewModelInstanceValue as rc.ViewModelInstanceString).value;
  }

  public set value(val: string) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceString).value = val;
  }
  public internalHandleCallback(callback: Function) {
    callback(this.value);
  }
}

export class ViewModelInstanceNumber extends ViewModelInstanceValue {
  constructor(instance: rc.ViewModelInstanceNumber, parent: ViewModelInstance) {
    super(instance, parent);
  }

  public get value(): number {
    return (this._viewModelInstanceValue as rc.ViewModelInstanceNumber).value;
  }

  public set value(val: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceNumber).value = val;
  }
  public internalHandleCallback(callback: Function) {
    callback(this.value);
  }
}

export class ViewModelInstanceBoolean extends ViewModelInstanceValue {
  constructor(
    instance: rc.ViewModelInstanceBoolean,
    parent: ViewModelInstance,
  ) {
    super(instance, parent);
  }

  public get value(): boolean {
    return (this._viewModelInstanceValue as rc.ViewModelInstanceBoolean).value;
  }

  public set value(val: boolean) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceBoolean).value = val;
  }
  public internalHandleCallback(callback: Function) {
    callback(this.value);
  }
}

export class ViewModelInstanceTrigger extends ViewModelInstanceValue {
  constructor(
    instance: rc.ViewModelInstanceTrigger,
    parent: ViewModelInstance,
  ) {
    super(instance, parent);
  }

  public trigger(): void {
    return (
      this._viewModelInstanceValue as rc.ViewModelInstanceTrigger
    ).trigger();
  }

  public internalHandleCallback(callback: Function) {
    callback();
  }
}

export class ViewModelInstanceEnum extends ViewModelInstanceValue {
  constructor(instance: rc.ViewModelInstanceEnum, parent: ViewModelInstance) {
    super(instance, parent);
  }

  public get value(): string {
    return (this._viewModelInstanceValue as rc.ViewModelInstanceEnum).value;
  }

  public set value(val: string) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceEnum).value = val;
  }

  public set valueIndex(val: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceEnum).valueIndex = val;
  }

  public get valueIndex(): number {
    return (this._viewModelInstanceValue as rc.ViewModelInstanceEnum)
      .valueIndex;
  }

  public get values(): string[] {
    return (this._viewModelInstanceValue as rc.ViewModelInstanceEnum).values;
  }

  public internalHandleCallback(callback: Function) {
    callback(this.value);
  }
}

export class ViewModelInstanceList extends ViewModelInstanceValue {
  constructor(instance: rc.ViewModelInstanceList, parent: ViewModelInstance) {
    super(instance, parent);
  }

  public get length(): number {
    return (this._viewModelInstanceValue as rc.ViewModelInstanceList).size;
  }

  public addInstance(instance: ViewModelInstance) {
    if (instance.runtimeInstance != null) {
      (this._viewModelInstanceValue as rc.ViewModelInstanceList).addInstance(
        instance.runtimeInstance!,
      );
      instance.addParent(this._parentViewModel);
    }
  }

  public addInstanceAt(instance: ViewModelInstance, index: number): boolean {
    if (instance.runtimeInstance != null) {
      if (
        (
          this._viewModelInstanceValue as rc.ViewModelInstanceList
        ).addInstanceAt(instance.runtimeInstance!, index)
      ) {
        instance.addParent(this._parentViewModel);
        return true;
      }
    }
    return false;
  }

  public removeInstance(instance: ViewModelInstance) {
    if (instance.runtimeInstance != null) {
      (this._viewModelInstanceValue as rc.ViewModelInstanceList).removeInstance(
        instance.runtimeInstance!,
      );
      instance.removeParent(this._parentViewModel);
    }
  }

  public removeInstanceAt(index: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceList).removeInstanceAt(
      index,
    );
  }

  public instanceAt(index: number): ViewModelInstance | null {
    const runtimeInstance = (
      this._viewModelInstanceValue as rc.ViewModelInstanceList
    ).instanceAt(index);
    if (runtimeInstance != null) {
      const viewModelInstance = new ViewModelInstance(
        runtimeInstance,
        this._parentViewModel,
      );
      return viewModelInstance;
    }
    return null;
  }

  public swap(a: number, b: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceList).swap(a, b);
  }

  public internalHandleCallback(callback: Function) {
    callback();
  }
}

export class ViewModelInstanceColor extends ViewModelInstanceValue {
  constructor(instance: rc.ViewModelInstanceColor, parent: ViewModelInstance) {
    super(instance, parent);
  }

  public get value(): number {
    return (this._viewModelInstanceValue as rc.ViewModelInstanceColor).value;
  }

  public set value(val: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceColor).value = val;
  }

  public rgb(r: number, g: number, b: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceColor).rgb(r, g, b);
  }

  public rgba(r: number, g: number, b: number, a: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceColor).argb(
      a,
      r,
      g,
      b,
    );
  }

  public argb(a: number, r: number, g: number, b: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceColor).argb(
      a,
      r,
      g,
      b,
    );
  }

  // Value 0 to 255
  public alpha(a: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceColor).alpha(a);
  }

  // Value 0 to 1
  public opacity(o: number) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceColor).alpha(
      Math.round(Math.max(0, Math.min(1, o)) * 255),
    );
  }
  public internalHandleCallback(callback: Function) {
    callback(this.value);
  }
}

export class ViewModelInstanceAssetImage extends ViewModelInstanceValue {
  constructor(
    instance: rc.ViewModelInstanceAssetImage,
    root: ViewModelInstance,
  ) {
    super(instance, root);
  }

  public set value(image: rc.Image | null) {
    (this._viewModelInstanceValue as rc.ViewModelInstanceAssetImage).value(
      image?.nativeImage ?? null,
    );
  }

  public internalHandleCallback(callback: Function) {
    callback();
  }
}

/**
 * Contents of a state machine input
 */
interface StateMachineInputContents {
  name: string;
  type: StateMachineInputType;
  initialValue?: boolean | number;
}

/**
 * Contents of a state machine
 */
interface StateMachineContents {
  name: string;
  inputs: StateMachineInputContents[];
}

/**
 * Contents of an artboard
 */
interface ArtboardContents {
  animations: string[];
  stateMachines: StateMachineContents[];
  name: string;
}

/**
 * contents of a Rive file
 */
interface RiveFileContents {
  artboards?: ArtboardContents[];
}

// Loads Rive data from a URI via fetch.
const loadRiveFile = async (src: string): Promise<ArrayBuffer> => {
  const req = new Request(src);
  const res = await fetch(req);
  const buffer = await res.arrayBuffer();
  return buffer;
};

// #endregion

// #region utility functions

/*
 * Utility function to ensure an object is a string array
 */
const mapToStringArray = (obj?: string[] | string | undefined): string[] => {
  if (typeof obj === "string") {
    return [obj];
  } else if (obj instanceof Array) {
    return obj;
  }
  // If obj is undefined, return empty array
  return [];
};

// #endregion

// #region testing utilities

// Exports to only be used for tests
export const Testing = {
  EventManager: EventManager,
  TaskQueueManager: TaskQueueManager,
};

// #endregion

// #region asset loaders

/**
 * Decodes bytes into an audio asset.
 *
 * Be sure to call `.unref()` on the audio once it is no longer needed. This
 * allows the engine to clean it up when it is not used by any more animations.
 */
export const decodeAudio = async (bytes: Uint8Array): Promise<rc.Audio> => {
  const decodedPromise = new Promise<rc.Audio>((resolve) =>
    RuntimeLoader.getInstance((rive: rc.RiveCanvas): void => {
      rive.decodeAudio(bytes, resolve);
    }),
  );
  const audio: rc.Audio = await decodedPromise;
  const audioWrapper = new AudioWrapper(audio);
  finalizationRegistry.register(audioWrapper, audio);
  return audioWrapper;
};

/**
 * Decodes bytes into an image.
 *
 * Be sure to call `.unref()` on the image once it is no longer needed. This
 * allows the engine to clean it up when it is not used by any more animations.
 */
export const decodeImage = async (bytes: Uint8Array): Promise<rc.Image> => {
  const decodedPromise = new Promise<rc.Image>((resolve) =>
    RuntimeLoader.getInstance((rive: rc.RiveCanvas): void => {
      rive.decodeImage(bytes, resolve);
    }),
  );
  const image: rc.Image = await decodedPromise;
  const imageWrapper = new ImageWrapper(image);
  finalizationRegistry.register(imageWrapper, image);
  return imageWrapper;
};

/**
 * Decodes bytes into a font.
 *
 * Be sure to call `.unref()` on the font once it is no longer needed. This
 * allows the engine to clean it up when it is not used by any more animations.
 */
export const decodeFont = async (bytes: Uint8Array): Promise<rc.Font> => {
  const decodedPromise = new Promise<rc.Font>((resolve) =>
    RuntimeLoader.getInstance((rive: rc.RiveCanvas): void => {
      rive.decodeFont(bytes, resolve);
    }),
  );
  const font: rc.Font = await decodedPromise;
  const fontWrapper = new FontWrapper(font);
  finalizationRegistry.register(fontWrapper, font);
  return fontWrapper;
};

// #endregion
