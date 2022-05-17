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
}) => {
  if (!canvas || !stateMachines.length || !renderer || !rive || !artboard) {
    return;
  }

    const mouseCallback = (event) => {
      const boundingRect = event.currentTarget.getBoundingClientRect();

      const canvasX = event.clientX - boundingRect.left;
      const canvasY = event.clientY - boundingRect.top;
      const forwardMatrix = rive.computeAlignment(fit, alignment, {
        minX: 0,
        minY: 0,
        maxX: boundingRect.width,
        maxY: boundingRect.height,
      }, artboard.bounds);
      let invertedMatrix = new rive.Mat2D();
      forwardMatrix.invert(invertedMatrix);
      const canvasCoordinatesVector = new rive.Vec2D(canvasX, canvasY);
      const transformedVector = rive.mapXY(invertedMatrix, canvasCoordinatesVector);
      const transformedX = transformedVector.x();
      const transformedY = transformedVector.y();

      switch (event.type) {
        // Pointer moving/hovering on the canvas
        case 'mousemove': {
          for (const stateMachine of stateMachines) {
            stateMachine.pointerMove(transformedX, transformedY);
          }
          break;
        }
        // Pointer click initiated but not released yet on the canvas
        case 'mousedown': {
          for (const stateMachine of stateMachines) {
            stateMachine.pointerDown(transformedX, transformedY);
          }
          break;
        }
        // Pointer click released on the canvas
        case 'mouseup': {
          for (const stateMachine of stateMachines) {
            stateMachine.pointerUp(transformedX, transformedY);
          }
          break;
        }
        default:
      }
    };

    canvas.addEventListener("mousemove", mouseCallback.bind(this));
    canvas.addEventListener("mousedown", mouseCallback.bind(this));
    canvas.addEventListener("mouseup", mouseCallback.bind(this));
};
