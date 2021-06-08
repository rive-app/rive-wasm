import * as rc from 'rive-canvas';
/**
 * Generic type for a parameterless void callback
 */
export declare type VoidCallback = () => void;
/**
 * Interface for artboard bounds
 */
export interface Bounds extends rc.AABB {
}
export declare enum Fit {
    Cover = "cover",
    Contain = "contain",
    Fill = "fill",
    FitWidth = "fitWidth",
    FitHeight = "fitHeight",
    None = "none",
    ScaleDown = "scaleDown"
}
export declare enum Alignment {
    Center = "center",
    TopLeft = "topLeft",
    TopCenter = "topCenter",
    TopRight = "topRight",
    CenterLeft = "centerLeft",
    CenterRight = "centerRight",
    BottomLeft = "bottomLeft",
    BottomCenter = "bottomCenter",
    BottomRight = "bottomRight"
}
export interface LayoutParameters {
    fit?: Fit;
    alignment?: Alignment;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
}
export declare class Layout {
    private cachedRuntimeFit;
    private cachedRuntimeAlignment;
    readonly fit: Fit;
    readonly alignment: Alignment;
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
    constructor(params?: LayoutParameters);
    static new({ fit, alignment, minX, minY, maxX, maxY }: LayoutParameters): Layout;
    /**
     * Makes a copy of the layout, replacing any specified parameters
     */
    copyWith({ fit, alignment, minX, minY, maxX, maxY }: LayoutParameters): Layout;
    runtimeFit(rive: rc.RiveCanvas): rc.Fit;
    runtimeAlignment(rive: rc.RiveCanvas): rc.Alignment;
}
export declare type RuntimeCallback = (rive: rc.RiveCanvas) => void;
export declare class RuntimeLoader {
    private static runtime;
    private static isLoading;
    private static callBackQueue;
    private static rive;
    private static wasmURL;
    private constructor();
    private static loadRuntime;
    static getInstance(callback: RuntimeCallback): void;
    static awaitInstance(): Promise<rc.RiveCanvas>;
    static setWasmUrl(url: string): void;
}
export declare enum StateMachineInputType {
    Number = 56,
    Trigger = 58,
    Boolean = 59
}
/**
 * An input for a state machine
 */
export declare class StateMachineInput {
    readonly type: StateMachineInputType;
    private runtimeInput;
    constructor(type: StateMachineInputType, runtimeInput: rc.SMIInput);
    /**
     * Returns the name of the input
     */
    get name(): string;
    /**
     * Returns the current value of the input
     */
    get value(): number | boolean;
    /**
     * Sets the value of the input
     */
    set value(value: number | boolean);
    /**
     * Fires a trigger; does nothing on Number or Boolean input types
     */
    fire(): void;
}
/**
 * Supported event types triggered in Rive
 */
export declare enum EventType {
    Load = "load",
    LoadError = "loaderror",
    Play = "play",
    Pause = "pause",
    Stop = "stop",
    Loop = "loop",
    Draw = "draw",
    StateChange = "statechange"
}
export interface Event {
    type: EventType;
    data?: string | string[] | LoopEvent;
}
/**
 * Looping types: one-shot, loop, and ping-pong
 */
export declare enum LoopType {
    OneShot = "oneshot",
    Loop = "loop",
    PingPong = "pingpong"
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
export declare type EventCallback = (event: Event) => void;
/**
 * Event listeners registered with the event manager
 */
export interface EventListener {
    type: EventType;
    callback: EventCallback;
}
declare class EventManager {
    private listeners;
    constructor(listeners?: EventListener[]);
    private getListeners;
    add(listener: EventListener): void;
    /**
     * Removes a listener
     * @param listener the listener with the callback to be removed
     */
    remove(listener: EventListener): void;
    /**
     * Clears all listeners of specified type, or every listener if no type is
     * specified
     * @param type the type of listeners to clear, or all listeners if not
     * specified
     */
    removeAll(type?: EventType): void;
    fire(event: Event): void;
}
export interface Task {
    action: VoidCallback;
    event?: Event;
}
declare class TaskQueueManager {
    private eventManager;
    private queue;
    constructor(eventManager: EventManager);
    add(task: Task): void;
    process(): void;
}
export interface RiveParameters {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    src?: string;
    buffer?: ArrayBuffer;
    artboard?: string;
    animations?: string | string[];
    stateMachines?: string | string[];
    layout?: Layout;
    autoplay?: boolean;
    onload?: EventCallback;
    onloaderror?: EventCallback;
    onplay?: EventCallback;
    onpause?: EventCallback;
    onstop?: EventCallback;
    onloop?: EventCallback;
    onstatechange?: EventCallback;
}
export interface RiveLoadParameters {
    src?: string;
    buffer?: ArrayBuffer;
    autoplay?: boolean;
    artboard?: string;
    animations?: string | string[];
    stateMachines?: string | string[];
}
export interface RiveResetParameters {
    artboard?: string;
    animations?: string | string[];
    stateMachines?: string | string[];
    autoplay?: boolean;
}
export declare class Rive {
    private readonly canvas;
    private src;
    private buffer;
    private _layout;
    private _updateLayout;
    private ctx;
    private renderer;
    /**
     * Flag to active/deactivate renderer
     */
    private isRendererActive;
    private loaded;
    /**
     * Tracks if a Rive file is loaded; we need this in addition to loaded as some
     * commands (e.g. contents) can be called as soon as the file is loaded.
     * However, playback commands need to be queued and run in order once initial
     * animations and autoplay has been sorted out. This applies to play, pause,
     * and start.
     */
    private readyForPlaying;
    private runtime;
    private artboard;
    private file;
    private eventManager;
    private taskQueue;
    private animator;
    private static readonly missingErrorMessage;
    constructor(params: RiveParameters);
    static new(params: RiveParameters): Rive;
    private init;
    private initData;
    private initArtboard;
    drawFrame(): void;
    private lastRenderTime;
    private frameRequestId;
    /**
     * Used be draw to track when a second of active rendering time has passed. Used for debugging purposes
     */
    private renderSecondTimer;
    /**
     * Draw rendering loop; renders animation frames at the correct time interval.
     * @param time the time at which to render a frame
     */
    private draw;
    /**
     * Align the renderer
     */
    private alignRenderer;
    /**
     * Cleans up any Wasm-generated objects that need to be manually destroyed:
     * artboard instances, animation instances, state machine instances.
     *
     * Once this is called, things will need to be reinitialized or bad things
     * might happen.
     */
    cleanup(): void;
    play(animationNames?: string | string[], autoplay?: true): void;
    pause(animationNames?: string | string[]): void;
    scrub(animationNames?: string | string[], value?: number): void;
    stop(animationNames?: string | string[] | undefined): void;
    /**
     * Resets the animation
     * @param artboard the name of the artboard, or default if none given
     * @param animations the names of animations for playback
     * @param stateMachines the names of state machines for playback
     * @param autoplay whether to autoplay when reset, defaults to false
     *
     */
    reset(params?: RiveResetParameters): void;
    load(params: RiveLoadParameters): void;
    set layout(layout: Layout);
    /**
     * Returns the current layout. Note that layout should be treated as
     * immutable. If you want to change the layout, create a new one use the
     * layout setter
     */
    get layout(): Layout;
    /**
     * Sets the layout bounds to the current canvas size; this is typically called
     * when the canvas is resized
     */
    resizeToCanvas(): void;
    get source(): string;
    /**
     * Returns the name of the active artboard
     */
    get activeArtboard(): string;
    get animationNames(): string[];
    /**
     * Returns a list of state machine names from the current artboard
     */
    get stateMachineNames(): string[];
    /**
     * Returns the inputs for the specified instanced state machine, or an empty
     * list if the name is invalid or the state machine is not instanced
     * @param name the state machine name
     * @returns the inputs for the named state machine
     */
    stateMachineInputs(name: string): StateMachineInput[];
    get playingStateMachineNames(): string[];
    get playingAnimationNames(): string[];
    get pausedAnimationNames(): string[];
    /**
     *  Returns a list of paused machine names
     * @returns a list of state machine names that are paused
     */
    get pausedStateMachineNames(): string[];
    /**
     * @returns true if any animation is playing
     */
    get isPlaying(): boolean;
    /**
     * @returns true if all instanced animations are paused
     */
    get isPaused(): boolean;
    /**
     * @returns true if no animations are playing or paused
     */
    get isStopped(): boolean;
    /**
     * @returns the bounds of the current artboard, or undefined if the artboard
     * isn't loaded yet.
     */
    get bounds(): Bounds;
    /**
     * Subscribe to Rive-generated events
     * @param type the type of event to subscribe to
     * @param callback callback to fire when the event occurs
     */
    on(type: EventType, callback: EventCallback): void;
    /**
     * Unsubscribes from a Rive-generated event
     * @param callback the callback to unsubscribe from
     */
    unsubscribe(type: EventType, callback: EventCallback): void;
    /**
     * Unsubscribes all listeners from an event type, or everything if no type is
     * given
     * @param type the type of event to unsubscribe from, or all types if
     * undefined
     */
    unsubscribeAll(type?: EventType): void;
    /**
     * Stops the rendering loop; this is different from pausing in that it doesn't
     * change the state of any animation. It stops rendering from occurring. This
     * is designed for situations such as when Rive isn't visible.
     *
     * The only way to start rendering again is to call `startRendering`.
     * Animations that are marked as playing will start from the position that
     * they would have been at if rendering had not been stopped.
     */
    stopRendering(): void;
    /**
     * Starts the rendering loop if it has been previously stopped. If the
     * renderer is already active, then this will have zero effect.
     */
    startRendering(): void;
    /**
     * Returns the contents of a Rive file: the artboards, animations, and state machines
     */
    get contents(): RiveFileContents;
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
export declare const Testing: {
    EventManager: typeof EventManager;
    TaskQueueManager: typeof TaskQueueManager;
};
export {};
