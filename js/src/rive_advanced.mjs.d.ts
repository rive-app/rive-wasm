interface RiveOptions {
    locateFile(file: string): string
  }
  
  declare function Rive(options?: RiveOptions): Promise<RiveCanvas>;
  export default Rive;
  
  export interface RiveCanvas {
    Alignment: AlignmentFactory;
    CanvasRenderer: typeof CanvasRenderer;
    LinearAnimationInstance: typeof LinearAnimationInstance;
    StateMachineInstance: typeof StateMachineInstance;
    Mat2D: typeof Mat2D;
    Vec2D: typeof Vec2D;
    AABB: AABB;
    SMIInput: typeof SMIInput;
    renderFactory: CanvasRenderFactory;
  
    BlendMode: typeof BlendMode;
    FillRule: typeof FillRule;
    Fit: typeof Fit;
    RenderPaintStyle: typeof RenderPaintStyle;
    StrokeCap: typeof StrokeCap;
    StrokeJoin: typeof StrokeJoin;
  
    load(buffer: Uint8Array): Promise<File>;
    makeRenderer(canvas: HTMLCanvasElement | OffscreenCanvas, useOffscreenRenderer?: boolean) : CanvasRenderer;
    computeAlignment(fit: Fit, alignment: Alignment, frame: AABB, content: AABB): Mat2D;
    mapXY(matrix: Mat2D, canvasPoints: Vec2D): Vec2D;
    requestAnimationFrame(cb: (timestamp: DOMHighResTimeStamp) => void): number;
    cancelAnimationFrame(requestID: number): void;
    enableFPSCounter(cb: (fps: number) => void): void;
    disableFPSCounter(): void;
  }
  
  //////////////
  // RENDERER //
  //////////////
  
  export declare class RendererWrapper {
    save(): void;
    restore(): void;
    transform(tranform: Mat2D): void;
    drawPath(path: RenderPath, paint: RenderPaint): void;
    clipPath(path: RenderPath): void;
    clear(): void;
    flush(): void;
    translate(x: number, y: number): void;
    rotate(angle: number): void;
  }
  
  export declare class RenderPathWrapper {
    reset(): void;
    addPath(path: CommandPath, transform: Mat2D): void;
    fillRule(value: FillRule): void;
    moveTo(x: number, y: number): void
    lineTo(x: number, y: number): void
    cubicTo(ox: number, oy: number, ix: number, iy: number, x: number, y: number): void;
    close(): void;
  }
  
  export declare class RenderPaintWrapper {
    color(value: number): void;
    thickness(value: number): void;
    join(value: StrokeJoin): void;
    cap(value: StrokeCap): void;
    blendMode(value: BlendMode): void;
    style(value: RenderPaintStyle): void;
    linearGradient(sx: number, sy: number, ex: number, ey: number): void;
    radialGradient(sx: number, sy: number, ex: number, ey: number): void;
    addStop(color: number, stop: number): void;
    completeGradient(): void;
  }
  
  export declare class Renderer extends RendererWrapper {
    align(fit: Fit, alignment: Alignment, frame: AABB, content: AABB): void
  }
  
  export declare class CommandPath { }
  
  export declare class RenderPath extends RenderPathWrapper { }
  
  export declare class RenderPaint extends RenderPaintWrapper { }
  
  
  /////////////////////
  // CANVAS RENDERER //
  /////////////////////
  
  export declare class CanvasRenderer extends Renderer {
    constructor(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D);
  }
  
  export declare class CanvasRenderPaint extends RenderPaint {
    draw(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, path: RenderPath): void;
  }
  
  export declare class CanvasRenderPath extends RenderPath { }
  
  export interface CanvasRenderFactory {
    makeRenderPaint(): CanvasRenderPaint;
    makeRenderPath(): CanvasRenderPath;
  }
  
  //////////
  // File //
  //////////
  export declare class File {
    defaultArtboard(): Artboard;              // rive::ArtboardInstance
    artboardByName(name: string): Artboard;   // rive::ArtboardInstance
    artboardByIndex(index: number): Artboard; // rive::ArtboardInstance
    artboardCount(): number;
  }

  // This wraps rive::ArtboardInstance*
  export declare class Artboard {
    get name(): string;
    get bounds(): AABB;
    get frameOrigin(): boolean;
    set frameOrigin(val: boolean);
    // Deletes the backing wasm artboard instance
    delete(): void;
    advance(sec: number): any;
    draw(renderer: CanvasRenderer): void;
    animationByName(name: string): LinearAnimationInstance;
    animationByIndex(index: number): LinearAnimationInstance;
    animationCount(): number;
    stateMachineByName(name: string): StateMachineInstance;
    stateMachineByIndex(index: number): StateMachineInstance;
    stateMachineCount(): number;
    bone(name: string): Bone;
    node(name: string): Node;
    rootBone(name: string): RootBone;
    transformComponent(name: string): TransformComponent;
  }
  
  export declare class Bone extends TransformComponent {
    length: number;
  }
  
  export declare class RootBone extends Bone {
    x: number;
    y: number;
  }
  
  export declare class Node extends TransformComponent {
    x: number;
    y: number;
  }
  
  export declare class TransformComponent {
    rotation: number;
    scaleX: number;
    scaleY: number;
    worldTransform(): Mat2D;
    parentWorldTransform(result: Mat2D): void;
  }
  
  ///////////////
  // Animation //
  ///////////////
  export declare class LinearAnimationInstance {
    constructor(animation: LinearAnimationInstance, artboard: Artboard);
    get name(): string;
    get duration(): number;
    get fps(): number;
    get workStart(): number;
    get workEnd(): number;
    get loopValue(): number;
    get speed(): number;
    /** Time of the animation in seconds */
    time: number;
    didLoop: boolean;
    advance(sec: number): any;
    /**
     * Apply animation on the artboard
     * @param mix 0-1 the strength of the animation in the animations mix.
     */
    apply(mix: number): any;
    // Deletes the backing Wasm animation instance
    delete(): void;
  }
  
  export declare class StateMachineInstance {
    constructor(stateMachine: StateMachineInstance, artboard: Artboard);
    get name(): string;
    inputCount(): number;
    input(i: number): SMIInput; 
    advance(sec: number): any;
    stateChangedCount(): number;
    stateChangedNameByIndex(i: number): string;

    // Call with coordinates in Artboard space
    pointerDown(x: number, y: number): void;
    pointerMove(x: number, y: number): void;
    pointerUp(x: number, y: number): void;
  
    // Deletes the backing Wasm state machine instance
    delete(): void;
  }
  
  export declare class SMIInput {
    static bool: number;
    static number: number;
    static trigger: number;
  
    get name(): string;
    get type(): number;
    get value(): boolean | number | undefined;
    set value(val: boolean | number | undefined);
    fire(): void;
    asBool(): SMIInput;
    asNumber(): SMIInput;
    asTrigger(): SMIInput;
  }
  
  export declare class SMIBool {
  
  }
  
  export declare class SMINumber {
    
  }
  
  export declare class SMITrigger {
    
  }
  
  ///////////
  // ENUMS //
  ///////////
  
  export enum Fit {
    fill,
    contain,
    cover,
    fitWidth,
    fitHeight,
    none,
    scaleDown,
  }
  
  export enum RenderPaintStyle {
    fill,
    stroke,
  }
  
  export enum FillRule {
    nonZero,
    evenOdd,
  }
  
  export enum StrokeCap {
    butt,
    round,
    square,
  }
  export enum StrokeJoin {
    miter,
    round,
    bevel,
  }
  
  export enum BlendMode {
    srcOver = 3,
    screen = 14,
    overlay = 15,
    darken = 16,
    lighten = 17,
    colorDodge = 18,
    colorBurn = 19,
    hardLight = 20,
    softLight = 21,
    difference = 22,
    exclusion = 23,
    multiply = 24,
    hue = 25,
    saturation = 26,
    color = 27,
    luminosity = 28,
  }
  
  ///////////
  // UTILS //
  ///////////
  
  export declare class Alignment {
    get x(): number;
    get y(): number;
  }
  
  export declare class AlignmentFactory {
    get topLeft(): Alignment;
    get topCenter(): Alignment;
    get topRight(): Alignment;
    get centerLeft(): Alignment;
    get center(): Alignment;
    get centerRight(): Alignment;
    get bottomLeft(): Alignment;
    get bottomCenter(): Alignment;
    get bottomRight(): Alignment;
  }
  
  export interface AABB {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }
  
  export declare class Mat2D {
    xx: number;
    xy: number;
    yx: number;
    yy: number;
    tx: number;
    ty: number;
    invert(mat: Mat2D): boolean;
  }

  export declare class Vec2D {
    x(): void;
    y(): void;
  }
  
