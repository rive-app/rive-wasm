import * as rc from "../rive_advanced.mjs";

export interface TouchInteractionsParams {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  artboard: rc.Artboard;
  stateMachines: rc.StateMachineInstance[];
  renderer: rc.Renderer;
  rive: rc.RiveCanvas;
  fit: rc.Fit;
  alignment: rc.Alignment;
}

/**
 * Registers mouse move/up/down callback handlers on the canvas to send meaningful coordinates to
 * the state machine pointer move/up/down functions based on cursor interaction
 */
export const registerTouchInteractions = ({
  canvas,
  artboard,
  stateMachines = [],
  renderer,
  rive,
  fit,
  alignment,
}: TouchInteractionsParams) => {
  if (
    !canvas ||
    !stateMachines.length ||
    !renderer ||
    !rive ||
    !artboard ||
    typeof window === "undefined"
  ) {
    return null;
  }

  const processEventCallback = (event: MouseEvent | TouchEvent) => {
    const boundingRect = (
      event.currentTarget as HTMLCanvasElement
    ).getBoundingClientRect();

    let canvasX;
    let canvasY;
    if (
      ["touchstart", "touchmove"].indexOf(event.type) > -1 &&
      (event as TouchEvent).touches?.length
    ) {
      canvasX = (event as TouchEvent).touches[0].clientX - boundingRect.left;
      canvasY = (event as TouchEvent).touches[0].clientY - boundingRect.top;
      event.preventDefault();
    } else if (
      event.type === "touchend" &&
      (event as TouchEvent).changedTouches?.length
    ) {
      canvasX =
        (event as TouchEvent).changedTouches[0].clientX - boundingRect.left;
      canvasY =
        (event as TouchEvent).changedTouches[0].clientY - boundingRect.top;
    } else {
      canvasX = (event as MouseEvent).clientX - boundingRect.left;
      canvasY = (event as MouseEvent).clientY - boundingRect.top;
    }
    const forwardMatrix = rive.computeAlignment(
      fit,
      alignment,
      {
        minX: 0,
        minY: 0,
        maxX: boundingRect.width,
        maxY: boundingRect.height,
      },
      artboard.bounds
    );
    const invertedMatrix = new rive.Mat2D();
    forwardMatrix.invert(invertedMatrix);
    const canvasCoordinatesVector = new rive.Vec2D(canvasX, canvasY);
    const transformedVector = rive.mapXY(
      invertedMatrix,
      canvasCoordinatesVector
    );
    const transformedX = transformedVector.x();
    const transformedY = transformedVector.y();

    transformedVector.delete();
    invertedMatrix.delete();
    canvasCoordinatesVector.delete();
    forwardMatrix.delete();

    switch (event.type) {
      // Pointer moving/hovering on the canvas
      case "touchmove":
      case "mouseover":
      case "mouseout":
      case "mousemove": {
        for (const stateMachine of stateMachines) {
          stateMachine.pointerMove(transformedX, transformedY);
        }
        break;
      }
      // Pointer click initiated but not released yet on the canvas
      case "touchstart":
      case "mousedown": {
        for (const stateMachine of stateMachines) {
          stateMachine.pointerDown(transformedX, transformedY);
        }
        break;
      }
      // Pointer click released on the canvas
      case "touchend":
      case "mouseup": {
        for (const stateMachine of stateMachines) {
          stateMachine.pointerUp(transformedX, transformedY);
        }
        break;
      }
      default:
    }
  };
  const callback = processEventCallback.bind(this);
  canvas.addEventListener("mouseover", callback);
  canvas.addEventListener("mouseout", callback);
  canvas.addEventListener("mousemove", callback);
  canvas.addEventListener("mousedown", callback);
  canvas.addEventListener("mouseup", callback);
  canvas.addEventListener("touchmove", callback);
  canvas.addEventListener("touchstart", callback);
  canvas.addEventListener("touchend", callback);
  return () => {
    canvas.removeEventListener("mouseover", callback);
    canvas.removeEventListener("mouseout", callback);
    canvas.removeEventListener("mousemove", callback);
    canvas.removeEventListener("mousedown", callback);
    canvas.removeEventListener("mouseup", callback);
    canvas.removeEventListener("touchmove", callback);
    canvas.removeEventListener("touchstart", callback);
    canvas.removeEventListener("touchend", callback);
  };
};
