import * as rc from "../rive_advanced.mjs";

export interface TouchInteractionsParams {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  artboard: rc.Artboard;
  stateMachines: rc.StateMachineInstance[];
  renderer: rc.Renderer;
  rive: rc.RiveCanvas;
  fit: rc.Fit;
  alignment: rc.Alignment;
  isTouchScrollEnabled?: boolean;
  dispatchPointerExit?: boolean;
  layoutScaleFactor?: number;
}

interface ClientCoordinates {
  clientX: number;
  clientY: number;
}

/**
 * Returns the clientX and clientY properties from touch or mouse events. Also
 * calls preventDefault() on the event if it is a touchstart or touchmove to prevent
 * scrolling the page on mobile devices
 * @param event - Either a TouchEvent or a MouseEvent
 * @returns - Coordinates of the clientX and clientY properties from the touch/mouse event
 */
const getClientCoordinates = (
  event: MouseEvent | TouchEvent,
  isTouchScrollEnabled: boolean,
): ClientCoordinates => {
  if (
    ["touchstart", "touchmove"].indexOf(event.type) > -1 &&
    (event as TouchEvent).touches?.length
  ) {
    // This flag, if false, prevents touch events on the canvas default behavior
    // which may prevent scrolling if a drag motion on the canvas is performed
    if (!isTouchScrollEnabled) {
      event.preventDefault();
    }
    return {
      clientX: (event as TouchEvent).touches[0].clientX,
      clientY: (event as TouchEvent).touches[0].clientY,
    };
  } else if (
    event.type === "touchend" &&
    (event as TouchEvent).changedTouches?.length
  ) {
    return {
      clientX: (event as TouchEvent).changedTouches[0].clientX,
      clientY: (event as TouchEvent).changedTouches[0].clientY,
    };
  } else {
    return {
      clientX: (event as MouseEvent).clientX,
      clientY: (event as MouseEvent).clientY,
    };
  }
};

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
  isTouchScrollEnabled = false,
  dispatchPointerExit = true,
  layoutScaleFactor = 1.0,
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
  /**
   * After a touchend event, some browsers may fire synthetic mouse events
   * (mouseover, mousedown, mousemove, mouseup) if the touch interaction did not cause
   * any default action (such as scrolling).
   *
   * This is done to simulate the behavior of a mouse for applications that do not support
   * touch events.
   *
   * We're keeping track of the previous event to not send the synthetic mouse events if the
   * touch event was a click (touchstart -> touchend).
   *
   * This is only needed when `isTouchScrollEnabled` is false
   * When true, `preventDefault()` is called which prevents this behaviour.
   **/
  let _prevEventType: string | null = null;
  let _syntheticEventsActive = false;

  const processEventCallback = (event: MouseEvent | TouchEvent) => {
    // Exit early out of all synthetic mouse events
    // https://stackoverflow.com/questions/9656990/how-to-prevent-simulated-mouse-events-in-mobile-browsers
    // https://stackoverflow.com/questions/25572070/javascript-touchend-versus-click-dilemma
    if (_syntheticEventsActive && event instanceof MouseEvent) {
      // Synthetic event finished
      if (event.type == "mouseup") {
        _syntheticEventsActive = false;
      }

      return;
    }

    // Test if it's a "touch click". This could cause the browser to send
    // synthetic mouse events.
    _syntheticEventsActive =
      isTouchScrollEnabled &&
      event.type === "touchend" &&
      _prevEventType === "touchstart";

    _prevEventType = event.type;

    const boundingRect = (
      event.currentTarget as HTMLCanvasElement
    ).getBoundingClientRect();

    const { clientX, clientY } = getClientCoordinates(
      event,
      isTouchScrollEnabled,
    );
    if (!clientX && !clientY) {
      return;
    }
    const canvasX = clientX - boundingRect.left;
    const canvasY = clientY - boundingRect.top;
    const forwardMatrix = rive.computeAlignment(
      fit,
      alignment,
      {
        minX: 0,
        minY: 0,
        maxX: boundingRect.width,
        maxY: boundingRect.height,
      },
      artboard.bounds,
      layoutScaleFactor,
    );
    const invertedMatrix = new rive.Mat2D();
    forwardMatrix.invert(invertedMatrix);
    const canvasCoordinatesVector = new rive.Vec2D(canvasX, canvasY);
    const transformedVector = rive.mapXY(
      invertedMatrix,
      canvasCoordinatesVector,
    );
    const transformedX = transformedVector.x();
    const transformedY = transformedVector.y();

    transformedVector.delete();
    invertedMatrix.delete();
    canvasCoordinatesVector.delete();
    forwardMatrix.delete();

    switch (event.type) {
      /**
       * There's a 2px buffer for a hitRadius when translating the pointer coordinates
       * down to the state machine. In cases where the hitbox is about that much away
       * from the Artboard border, we don't have exact precision on determining pointer
       * exit. We're therefore adding to the translated coordinates on mouseout of a canvas
       * to ensure that we report the mouse has truly exited the hitarea.
       * https://github.com/rive-app/rive-cpp/blob/master/src/animation/state_machine_instance.cpp#L336
       *
       */
      case "mouseout":
        for (const stateMachine of stateMachines) {
          if (dispatchPointerExit) {
            stateMachine.pointerExit(transformedX, transformedY);
          } else {
            stateMachine.pointerMove(transformedX, transformedY);
          }
        }
        break;

      // Pointer moving/hovering on the canvas
      case "touchmove":
      case "mouseover":
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
  canvas.addEventListener("touchmove", callback, {
    passive: isTouchScrollEnabled,
  });
  canvas.addEventListener("touchstart", callback, {
    passive: isTouchScrollEnabled,
  });
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
