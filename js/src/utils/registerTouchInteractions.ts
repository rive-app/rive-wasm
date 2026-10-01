import * as rc from "../rive_advanced.mjs";

// A detented wheel reports lines; the runtime wants pixels.
const PIXELS_PER_LINE = 16;
// ScrollPhase.update. The DOM reports no gesture phase, so every wheel event
// is an update and the runtime closes the gesture once it goes quiet.
const SCROLL_PHASE_UPDATE = 1;

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
  enableMultiTouch?: boolean;
  layoutScaleFactor?: number;
  // Handles advancing the state machine and draining events/view model property callbacks, applicable to certain pointer interactions
  // pointerDown: the drain runs inside touchstart/mousedown
  advanceAndDrain: (
    elapsedTime: number,
    options?: { pointerDown?: boolean },
  ) => void;
  summonKeyboard?: () => void;
  // True while the text input proxy holds DOM focus
  isTextProxyFocused?: () => boolean;
}

interface ClientCoordinates {
  clientX: number;
  clientY: number;
  identifier: number;
  transformedX?: number | undefined;
  transformedY?: number | undefined;
}

/**
 * Extracts ClientCoordinates from a TouchList, respecting multi-touch vs.
 * single-touch mode. In single-touch mode, only the touch matching
 * primaryTouchId is returned (or the first touch when primaryTouchId is null).
 */
const getTouchCoordinates = (
  changedTouches: TouchList,
  enableMultiTouch: boolean,
  primaryTouchId: number | null,
): ClientCoordinates[] => {
  const coordinates: ClientCoordinates[] = [];
  if (enableMultiTouch) {
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      coordinates.push({
        clientX: touch.clientX,
        clientY: touch.clientY,
        identifier: touch.identifier,
      });
    }
  } else {
    // In "single-touch mode", only track the primary finger identified at touchstart.
    // Search changedTouches for the touch matching the recorded primary touch identifier, or (on initial touchstart)
    // take the first available touch identifier.
    let primaryTouch: Touch | null =
      primaryTouchId !== null
        ? Array.from(changedTouches).find(
            (t) => t.identifier === primaryTouchId,
          ) ?? null
        : changedTouches[0];
    if (primaryTouch) {
      coordinates.push({
        clientX: primaryTouch.clientX,
        clientY: primaryTouch.clientY,
        identifier: primaryTouch.identifier,
      });
    }
  }
  return coordinates;
};

/**
 * Returns the clientX and clientY properties from touch or mouse events. Also
 * calls preventDefault() on the event if it is a touchstart or touchmove to prevent
 * scrolling the page on mobile devices
 * @param event - Either a TouchEvent or a MouseEvent
 * @param isTouchScrollEnabled - Whether touch scrolling is enabled
 * @param enableMultiTouch - Whether to process multiple simultaneous touches
 * @param primaryTouchId - When working with single touches, only process the touch
 *   with this identifier. Pass null to accept any touch (used during touchstart to
 *   capture the first finger down).
 * @returns - Coordinates of the clientX and clientY properties from the touch/mouse event
 */
const getClientCoordinates = (
  event: MouseEvent | TouchEvent,
  isTouchScrollEnabled: boolean,
  enableMultiTouch: boolean,
  primaryTouchId: number | null,
): ClientCoordinates[] => {
  const touchEvent = event as TouchEvent;
  if (touchEvent.changedTouches?.length) {
    // This flag, if false, prevents touch events on the canvas default behavior
    // which may prevent scrolling if a drag motion on the canvas is performed
    if (!isTouchScrollEnabled && ["touchstart", "touchmove"].includes(event.type)) {
      event.preventDefault();
    }
    return getTouchCoordinates(touchEvent.changedTouches, enableMultiTouch, primaryTouchId);
  }
  return [
    {
      clientX: (event as MouseEvent).clientX,
      clientY: (event as MouseEvent).clientY,
      identifier: 0,
    },
  ];
};

/**
 * Registers mouse move/up/down and wheel callback handlers on the canvas to send meaningful
 * coordinates to the state machine pointer move/up/down/scroll functions based on cursor
 * interaction
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
  enableMultiTouch = false,
  layoutScaleFactor = 1.0,
  advanceAndDrain,
  summonKeyboard,
  isTextProxyFocused,
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
  // A gesture latched before the previous listeners came down (a pause, say)
  // never reached its idle timeout, and would take the next wheel wherever
  // it lands. These instances are live here; at teardown they may not be.
  for (const stateMachine of stateMachines) {
    stateMachine.cancelScroll();
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
   * Emulated events only occur when `isTouchScrollEnabled` is true; when false,
   * touchstart is default-prevented, which suppresses them.
   * Emulated mousedown is prevented while the proxy is focused, or it would blur it and
   * drop the keyboard.
   **/
  let _prevEventType: string | null = null;
  let _syntheticEventsActive = false;

  /**
   * When enableMultiTouch is false ("single-touch mode"), we track the identifier of the first finger that touched down.
   * All subsequent touch events are filtered to this identifier so that a second finger
   * moving cannot displace the tracked pointer position.
   * Reset to null when the primary finger lifts (or touchcancel is called)
   */
  let _primaryTouchId: number | null = null;

  /**
   * Maps client-space points into Artboard space through the fit and alignment
   * of the canvas.
   */
  const mapToArtboard = (
    boundingRect: DOMRect,
    points: { clientX: number; clientY: number }[],
  ): { x: number; y: number }[] => {
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

    const mapped = points.map(({ clientX, clientY }) => {
      const canvasX = clientX - boundingRect.left;
      const canvasY = clientY - boundingRect.top;
      const canvasCoordinatesVector = new rive.Vec2D(canvasX, canvasY);
      const transformedVector = rive.mapXY(
        invertedMatrix,
        canvasCoordinatesVector,
      );
      const point = { x: transformedVector.x(), y: transformedVector.y() };
      transformedVector.delete();
      canvasCoordinatesVector.delete();
      return point;
    });

    invertedMatrix.delete();
    forwardMatrix.delete();
    return mapped;
  };

  const processEventCallback = (event: MouseEvent | TouchEvent) => {
    // Exit early out of all synthetic mouse events
    // https://stackoverflow.com/questions/9656990/how-to-prevent-simulated-mouse-events-in-mobile-browsers
    // https://stackoverflow.com/questions/25572070/javascript-touchend-versus-click-dilemma
    if (_syntheticEventsActive && event instanceof MouseEvent) {
      if (event.type === "mousedown" && isTextProxyFocused?.()) {
        event.preventDefault();
      }
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

    // On touchstart in single-touch mode, record the first new finger as the primary
    // touch if we aren't already tracking one.
    if (!enableMultiTouch && event.type === "touchstart" && _primaryTouchId === null) {
      const firstTouch = (event as TouchEvent).changedTouches?.[0];
      if (firstTouch) {
        _primaryTouchId = firstTouch.identifier;
      }
    }

    const coordinateSets = getClientCoordinates(
      event,
      isTouchScrollEnabled,
      enableMultiTouch,
      enableMultiTouch ? null : _primaryTouchId,
    );
    const positionedSets = coordinateSets.filter(
      (coordinateSet) => coordinateSet.clientX || coordinateSet.clientY,
    );
    mapToArtboard(boundingRect, positionedSets).forEach((point, i) => {
      positionedSets[i].transformedX = point.x;
      positionedSets[i].transformedY = point.y;
    });

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
            coordinateSets.forEach((coordinateSet) => {
              stateMachine.pointerExit(
                coordinateSet.transformedX,
                coordinateSet.transformedY,
                coordinateSet.identifier,
              );
            });
          } else {
            coordinateSets.forEach((coordinateSet) => {
              stateMachine.pointerMove(
                coordinateSet.transformedX,
                coordinateSet.transformedY,
                coordinateSet.identifier,
              );
            });
          }
        }
        break;

      // Pointer moving/hovering on the canvas
      case "touchmove":
      case "mouseover":
      case "mousemove": {
        for (const stateMachine of stateMachines) {
          coordinateSets.forEach((coordinateSet) => {
            stateMachine.pointerMove(
              coordinateSet.transformedX,
              coordinateSet.transformedY,
              coordinateSet.identifier,
            );
          });
        }
        break;
      }
      // Pointer click initiated but not released yet on the canvas
      case "touchstart":
      case "mousedown": {
        for (const stateMachine of stateMachines) {
          coordinateSets.forEach((coordinateSet) => {
            stateMachine.pointerDown(
              coordinateSet.transformedX,
              coordinateSet.transformedY,
              coordinateSet.identifier,
            );
          });
        }
        // Advance the state machine immediately so pointer down(s) takes effect synchronously
        advanceAndDrain(0, { pointerDown: true });
        break;
      }
      // Pointer click released on the canvas
      case "touchend": {
        for (const stateMachine of stateMachines) {
          coordinateSets.forEach((coordinateSet) => {
            stateMachine.pointerUp(
              coordinateSet.transformedX,
              coordinateSet.transformedY,
              coordinateSet.identifier,
            );
            stateMachine.pointerExit(
              coordinateSet.transformedX,
              coordinateSet.transformedY,
              coordinateSet.identifier,
            );
          });
        }
        // Advance the state machine immediately so pointer up(s) takes effect synchronously
        advanceAndDrain(0);
        // Still inside the touch gesture — summon the keyboard if the tap focused a
        // text input
        summonKeyboard?.();
        // Release the primary touch lock once that finger lifts so the next
        // touchstart can claim a new primary finger.
        if (
          !enableMultiTouch &&
          coordinateSets.some((c) => c.identifier === _primaryTouchId)
        ) {
          _primaryTouchId = null;
        }
        break;
      }
      case "mouseup": {
        for (const stateMachine of stateMachines) {
          coordinateSets.forEach((coordinateSet) => {
            stateMachine.pointerUp(
              coordinateSet.transformedX,
              coordinateSet.transformedY,
              coordinateSet.identifier,
            );
          });
        }
        // Advance the state machine immediately so pointer up(s) takes effect synchronously
        advanceAndDrain(0);
        summonKeyboard?.();
        break;
      }
      default:
    }
  };

  const touchCancelCallback = () => {
    _primaryTouchId = null;
  };

  /**
   * Forwards wheel and trackpad scrolling to the state machines. The page keeps
   * the wheel unless a scroll view actually moves, so it still scrolls when
   * Rive has nothing to scroll or a view sits at its edge.
   */
  const wheelCallback = (event: WheelEvent) => {
    // Pinch zoom arrives as a ctrl+wheel and belongs to the page. A wheel that
    // can't be cancelled is part of a sequence the page is already scrolling;
    // taking it too would move both.
    if (event.ctrlKey || !event.cancelable) {
      return;
    }
    // Read before the deltas: Firefox reports pixels once a delta has been
    // read first.
    const deltaMode = event.deltaMode;
    let deltaX = event.deltaX;
    let deltaY = event.deltaY;
    // Shift+wheel scrolls sideways. Most browsers already report it on the x
    // axis; a vertical-only view would decline it on y.
    if (event.shiftKey && !deltaX) {
      deltaX = deltaY;
      deltaY = 0;
    }

    const boundingRect = (
      event.currentTarget as HTMLCanvasElement
    ).getBoundingClientRect();
    // A page is the canvas's visible size, the nearest the host can get to the
    // scroll view's own.
    const toPixelsX =
      deltaMode === WheelEvent.DOM_DELTA_LINE
        ? PIXELS_PER_LINE
        : deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? boundingRect.width
          : 1;
    const toPixelsY =
      deltaMode === WheelEvent.DOM_DELTA_LINE
        ? PIXELS_PER_LINE
        : deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? boundingRect.height
          : 1;
    // The DOM reports how far to scroll; the runtime wants how far content
    // travels.
    const scrollX = -deltaX * toPixelsX;
    const scrollY = -deltaY * toPixelsY;
    if (!scrollX && !scrollY) {
      return;
    }

    // Mapping both ends of the delta keeps only the scale of the fit.
    const [position, moved] = mapToArtboard(boundingRect, [
      { clientX: event.clientX, clientY: event.clientY },
      { clientX: event.clientX + scrollX, clientY: event.clientY + scrollY },
    ]);
    // The DOM never says whether a pixel delta came from a trackpad, so it
    // counts as precise either way, as it does in the browser's own scrolling.
    const precise = deltaMode === WheelEvent.DOM_DELTA_PIXEL;
    const timeStamp = event.timeStamp / 1000;

    // A latched state machine owns the rest of its gesture, even past its edge.
    const latched = stateMachines.filter((sm) => sm.hasScrollLatch());
    const ordered = latched.concat(
      stateMachines.filter((sm) => latched.indexOf(sm) === -1),
    );
    const consumed = ordered.some(
      (stateMachine) =>
        stateMachine.pointerScroll(
          position.x,
          position.y,
          moved.x - position.x,
          moved.y - position.y,
          SCROLL_PHASE_UPDATE,
          precise,
          timeStamp,
          0,
        ) !== 0,
    );
    if (!consumed) {
      return;
    }
    event.preventDefault();
    // Advance now so the scroll lands on the next frame drawn.
    advanceAndDrain(0);
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
  canvas.addEventListener("touchcancel", touchCancelCallback);
  // Not passive, or preventDefault could not keep the page from scrolling.
  canvas.addEventListener("wheel", wheelCallback, { passive: false });
  return () => {
    canvas.removeEventListener("mouseover", callback);
    canvas.removeEventListener("mouseout", callback);
    canvas.removeEventListener("mousemove", callback);
    canvas.removeEventListener("mousedown", callback);
    canvas.removeEventListener("mouseup", callback);
    canvas.removeEventListener("touchmove", callback);
    canvas.removeEventListener("touchstart", callback);
    canvas.removeEventListener("touchend", callback);
    canvas.removeEventListener("touchcancel", touchCancelCallback);
    canvas.removeEventListener("wheel", wheelCallback);
  };
};
