type CanvasFit = 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight' | 'none' | 'scaleDown';
type CanvasAlignmentValue = 'center' | 'topLeft' | 'topCenter' | 'topRight' | 'centerLeft' | 'centerRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';

export interface CanvasAlignmentOptions {
  fit?: CanvasFit;
  alignment?: CanvasAlignmentValue;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}

export declare class CanvasAlignment {
  constructor(options: CanvasAlignmentOptions);
  fit: CanvasFit;
  alignment: CanvasAlignmentValue;
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
}


type LoopType = 'oneShot' | 'loop' | 'pingPong';

declare class LoopEvent {
  /** Name of the animation which triggers the event */
  animationName: string;
  /** Index of the type: 0 (oneShot), 1 (loop), 2 (pingPong)  */
  loopType: number;
  /** Type of loop of the animation  */
  loopName: LoopType;
}

interface AnimationEvents {
  load: string;
  loaderror: string;
  play: string;
  pause: string;
  stop: string;
  playerror: string;
  loop: LoopEvent;
}

interface RiveAnimationOptions {
  /** uri foir a Rive file (.riv) */
  src?: string;
  /** ArrayBuffer containing Rive data */
  buffer?: ArrayBuffer;
  /** Name of the artboard to load. Fallback to the default one if not provided */
  artboard?: string;
  /** Name of the animations to run. Fallback to the default one if not provided */
  animations?: string | string[];
  /** Canvas on which to load the animation */
  canvas: HTMLCanvasElement | OffscreenCanvas;
  alignment?: CanvasAlignment;
  /** Should then animation run when loaded */
  autoplay?: boolean;
  onload?(cb: (message: string) => void): void;
  onloaderror?(cb: (error: string) => void): void;
  onplay?(cb: (message: string) => void): void;
  onpause?(cb: (message: string) => void): void;
  onstop?(cb: (message: string) => void): void;
  onplayerror?(cb: (error: string) => void): void;
  onloop?(cb: (event: LoopEvent) => void): void;
}


export declare class RiveAnimation {
  constructor(options: RiveAnimationOptions);
  /** Starts/continues playback */
  play(): void;
  /** Pauses playback */
  pause(): void;
  /** Stops playback; this will restart the animation states to the first frame */
  stop(): void;
  /** Returns true if playback is playing */
  isPlaying(): boolean;
  /** Returns true if playback is paused */
  isPaused(): boolean;
  /** Returns true if playback is stopped */
  isStopped(): boolean;
  /* Returns the animation source/name */
  source(): string;
  /* Returns a list of the names of animations on the chosen artboard */
  animationNames(): string[];

  /** Listen on events from the Animation */
  on<K extends keyof AnimationEvents>(event: K, cb: (event: AnimationEvents[K]) => void): RiveAnimation;
}

