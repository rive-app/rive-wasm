import type {
  LinearAnimationInstance,
  LinearAnimation,
  Artboard,
  RiveCanvas,
} from "./../rive_advanced.mjs";

/**
 * Represents an animation that can be played on an Artboard. 
 * Wraps animations and instances from the runtime and keeps track of playback state.
 *
 * The `Animation` class manages the state and behavior of a single animation instance,
 * including its current time, loop count, and ability to scrub to a specific time.
 *
 * The class provides methods to advance the animation, apply its interpolated keyframe
 * values to the Artboard, and clean up the underlying animation instance when the
 * animation is no longer needed.
 */
export class Animation {
  public loopCount = 0;
  public readonly instance: LinearAnimationInstance;

  /**
   * The time to which the animation should move to on the next render.
   * If not null, the animation will scrub to this time instead of advancing by the given time.
   */
  public scrubTo: number | null = null;

  /**
   * Constructs a new animation
   * @constructor
   * @param {any} animation: runtime animation object
   * @param {any} instance: runtime animation instance object
   */
  constructor(
    private animation: LinearAnimation,
    private artboard: Artboard,
    runtime: RiveCanvas,
    public playing: boolean
  ) {
    this.instance = new runtime.LinearAnimationInstance(animation, artboard);
  }

  /**
   * Returns the animation's name
   */
  public get name(): string {
    return this.animation.name;
  }

  /**
   * Returns the animation's name
   */
  public get time(): number {
    return this.instance.time;
  }

  /**
   * Sets the animation's current time
   */
  public set time(value: number) {
    this.instance.time = value;
  }

  /**
   * Returns the animation's loop type
   */
  public get loopValue(): number {
    return this.animation.loopValue;
  }

  /**
   * Indicates whether the animation needs to be scrubbed.
   * @returns `true` if the animation needs to be scrubbed, `false` otherwise.
   */
  public get needsScrub(): boolean {
    return this.scrubTo !== null;
  }

  /**
   * Advances the animation by the give time. If the animation needs scrubbing,
   * time is ignored and the stored scrub value is used.
   * @param time the time to advance the animation by if no scrubbing required
   */
  public advance(time: number) {
    if (this.scrubTo === null) {
      this.instance.advance(time);
    } else {
      this.instance.time = 0;
      this.instance.advance(this.scrubTo);
      this.scrubTo = null;
    }
  }

  /**
   * Apply interpolated keyframe values to the artboard. This should be called after calling
   * .advance() on an animation instance so that new values are applied to properties.
   *
   * Note: This does not advance the artboard, which updates all objects on the artboard
   * @param mix - Mix value for the animation from 0 to 1
   */
  public apply(mix: number) {
    this.instance.apply(mix);
  }

  /**
   * Deletes the backing Wasm animation instance; once this is called, this
   * animation is no more.
   */
  public cleanup() {
    this.instance.delete();
  }
}
