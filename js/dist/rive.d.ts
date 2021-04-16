import * as rc from 'rive-canvas';
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
    private static wasmWebPath;
    private static wasmFilePath;
    private static testMode;
    private constructor();
    private static loadRuntime;
    static getInstance(callback: RuntimeCallback): void;
    static awaitInstance(): Promise<rc.RiveCanvas>;
    static setTestMode(mode: boolean): void;
}
export declare enum StateMachineInputType {
    Number = 56,
    Trigger = 58,
    Boolean = 59
}
/**
 * An input for a state machine
 */
declare class StateMachineInput {
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
    Draw = "draw"
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
    remove(listener: EventListener): void;
    fire(event: Event): void;
}
export interface Task {
    action: ActionCallback;
    event?: Event;
}
export declare type ActionCallback = () => void;
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
}
export interface RiveLoadParameters {
    src?: string;
    buffer?: ArrayBuffer;
    autoplay?: boolean;
    artboard?: string;
    animations?: string | string[];
    stateMachines?: string | string[];
}
export declare class Rive {
    private readonly canvas;
    private autoplay;
    private src;
    private buffer;
    private _layout;
    private _updateLayout;
    private ctx;
    private renderer;
    private playState;
    private loaded;
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
    private draw;
    /**
     * Align the renderer
     */
    private alignRenderer;
    play(animationNames?: string | string[]): void;
    pause(animationNames?: string | string[]): void;
    stop(animationNames?: string | string[] | undefined): void;
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
    get animationNames(): string[];
    /**
     * Returns a list of state machine names from the current artboard
     */
    get stateMachineNames(): string[];
    /**
     * Gets a runtime state machine object by name
     * @param name the name of the state machine
     * @returns a runtime state machine
     */
    private getRuntimeStateMachine;
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
    get isPlaying(): boolean;
    get isPaused(): boolean;
    get isStopped(): boolean;
    on(type: EventType, callback: EventCallback): void;
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
