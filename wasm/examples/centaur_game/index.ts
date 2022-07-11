import RiveCanvas, {
  Artboard,
  SMIInput,
  StateMachineInstance,
} from "@rive-app/canvas-advanced-single";
import Centaur from "./centaur.riv";

interface AppleInstanceData {
  x: number;
  y: number;
  artboard: Artboard;
  machine: StateMachineInstance;
  explodeTrigger: SMIInput;
}

interface ArrowInstanceData {
  artboard: Artboard;
  translation: {
    x: number;
    y: number;
  };
  heading: { x: number; y: number };
  time: number;
}

const appleRadius = 40;
const appleRadiusSquared = appleRadius * appleRadius;

async function main() {
  let rive = await RiveCanvas();
  // Instance the Rive runtime (this does WASM stuff).
  // Get some rive file bytes (we uploaded piggy.riv into this
  // sandbox, you can see it in the file list on the left.)
  let fileBytes = new Uint8Array(
    await (await fetch(new Request(Centaur))).arrayBuffer()
  );
  // Turn bytes into a runtime representation of the file.
  const file = await rive.load(fileBytes);

  // Get the character artboard.
  const character = file.artboardByName("Character");
  const arrow = file.artboardByName("Arrow");
  const apple = file.artboardByName("Apple");
  // Set frame origin to false so the arrow isn't offset by the
  // origin in artboard space. This allows us to easily assume
  // artboard space is worldspace.
  arrow.frameOrigin = false;
  const target = character.node("Look");
  const arrows = new Set<ArrowInstanceData>();
  const apples = new Set<AppleInstanceData>();

  const minApples = 1;
  const maxApples = 5;
  const appleBounds = apple.bounds;
  // Spawn a random amount of apples (1-5) and creates that many
  // new Apple state machine instances from "Apple" artboard
  // Returns a set of custom objects for each apple instance with a random
  // static position, the artboard instance of the apple,
  // the specific instance of that state machine generated
  // and the specific instance of the "explode" triggger input
  function spawnApples() {
    const count =
      Math.round(Math.random() * (maxApples - minApples)) + minApples;
    while (apples.size < count) {
      const aplInstance = file.artboardByName("Apple");
      const appleMachine = new rive.StateMachineInstance(
        apple.stateMachineByName("Apple"),
        aplInstance
      );
      let explodeTrigger;
      for (let i = 0, l = appleMachine.inputCount(); i < l; i++) {
        const input = appleMachine.input(i);
        switch (input.name) {
          case "Explode":
            explodeTrigger = input.asTrigger();
            break;

          default:
            break;
        }
      }

      const appleInstance = {
        x: -appleBounds.maxX + Math.random() * appleBounds.maxX * 3,
        y: -appleBounds.maxY + Math.random() * -appleBounds.maxY,
        artboard: aplInstance,
        machine: appleMachine,
        explodeTrigger: explodeTrigger,
      };
      appleMachine.advance(0);
      appleInstance.artboard.advance(0);

      apples.add(appleInstance);
    }
  }

  spawnApples();

  // Find the ArrowLocation node.
  const arrowLocation = character.node("ArrowLocation");
  const characterRoot = character.node("Character");

  // This artboard has a state machine that just waits for a "Pressed"
  // trigger to be fired to play the bounce/throw animation.
  const motionMachine = new rive.StateMachineInstance(
    character.stateMachineByName("Motion"),
    character
  );

  let moveInput, fireInput;
  // This low level portion of the API requires iterating the inputs
  // to find the one you want.
  for (let i = 0, l = motionMachine.inputCount(); i < l; i++) {
    const input = motionMachine.input(i);
    switch (input.name) {
      case "Fire":
        fireInput = input.asTrigger();
        break;
      case "Move":
        moveInput = input.asNumber();
        break;
      default:
        break;
    }
  }

  const canvas = document.getElementById("canvas0") as HTMLCanvasElement;
  // Helper to update the size of the canvas to fit the window.
  function computeSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.onresize = computeSize;
  computeSize();

  const renderer = rive.makeRenderer(canvas);

  // Game variables.
  let currentMoveSpeed = 0;
  const moveSpeed = 100;

  let characterX = 0;
  let characterDirection = 1;
  let direction = 0;
  let lastTime;
  let cursorX = 0,
    cursorY = 0;
  let fwdMatrix = new rive.Mat2D();
  const inverseViewMatrix = new rive.Mat2D();
  const targetParentWorld = new rive.Mat2D();
  const inverseTargetParentWorld = new rive.Mat2D();

  // Expand the bounds of the character artboard a bit so it
  // fits into the scene with some padding on the left and
  // right to move the character around.
  const bounds = character.bounds;
  const characterWidth = bounds.maxX - bounds.minX;
  bounds.minX -= characterWidth * 1.5;
  bounds.maxX += characterWidth * 1.5;

  function draw(time) {
    if (!lastTime) {
      lastTime = time;
    }
    const elapsedSeconds = (time - lastTime) / 1000;
    lastTime = time;

    renderer.clear();

    // Advance the Motion state machine
    motionMachine.advance(elapsedSeconds);
    // Advance the associated character artboard
    character.advance(elapsedSeconds);

    moveInput.value = direction * characterDirection;
    const targetMoveSpeed =
      direction === 0 ? 0 : direction > 0 ? moveSpeed : -moveSpeed;
    currentMoveSpeed +=
      (targetMoveSpeed - currentMoveSpeed) * Math.min(1, elapsedSeconds * 10);
    characterX += elapsedSeconds * currentMoveSpeed;

    // Instead of cleraing, let's just fill with a color that's not white.
    // renderer.fillStyle = "#888";
    // renderer.fillRect(0, 0, canvas.width, canvas.height);
    renderer.save();
    // Compute the view matrix so that we can invert it to go from screen
    // space (like cursors) to character's artboard space.
    fwdMatrix = rive.computeAlignment(
      rive.Fit.contain,
      rive.Alignment.bottomCenter,
      {
        minX: 0,
        minY: 0,
        maxX: canvas.width,
        maxY: canvas.height,
      },
      bounds
    );

    // Transform by the view matrix.
    renderer.transform(fwdMatrix);
    // Invert the view matrix in order to go from cursor to artboard space.
    if (fwdMatrix.invert(inverseViewMatrix)) {
      const x =
        inverseViewMatrix.xx * cursorX +
        inverseViewMatrix.yx * cursorY +
        inverseViewMatrix.tx;
      const y =
        inverseViewMatrix.xy * cursorX +
        inverseViewMatrix.yy * cursorY +
        inverseViewMatrix.ty;

      // Check if we should invert the character's direction by comparing
      // the world location of the cursor to the world location of the
      // character (need to compensate by character movement, characterX).
      characterDirection =
        characterRoot.worldTransform().tx < x - characterX ? 1 : -1;
      characterRoot.scaleX = characterDirection;

      // Draw a little circle where we think the cursor is (in world space at this point).
      // renderer.beginPath();
      // renderer.arc(x, y, 20, 0, 2 * Math.PI);
      // renderer.stroke();

      // Place the target at the cursor.
      // Get the parent world transform of the target "look" node.
      target.parentWorldTransform(targetParentWorld);
      // Invert it to so we can go from world to local.
      if (targetParentWorld.invert(inverseTargetParentWorld)) {
        const worldCursorX = x - characterX;
        const worldCursorY = y;

        let tx =
          inverseTargetParentWorld.xx * worldCursorX +
          inverseTargetParentWorld.yx * worldCursorY +
          inverseTargetParentWorld.tx;
        const ty =
          inverseTargetParentWorld.xy * worldCursorX +
          inverseTargetParentWorld.yy * worldCursorY +
          inverseTargetParentWorld.ty;

        target.x = tx;
        target.y = ty;
      }
    }

    renderer.save();
    renderer.translate(characterX, 0);

    character.draw(renderer);
    renderer.restore();

    for (let arrowInstance of Array.from(arrows)) {
      const { artboard, translation, heading, time } = arrowInstance;
      arrowInstance.time += elapsedSeconds;
      if (time < 0.1) {
        // arrow still leaving bow...
        continue;
      }

      for (let appleInstance of Array.from(apples)) {
        const { explodeTrigger, x, y } = appleInstance;
        const dx = x + appleBounds.maxX / 2 - translation.x;
        const dy = y + appleBounds.maxY / 2 - translation.y;
        if (dx * dx + dy * dy < appleRadiusSquared) {
          explodeTrigger.fire();
        }
      }
      renderer.save();
      renderer.translate(translation.x, translation.y);
      renderer.rotate(Math.atan2(heading.y, heading.x));
      artboard.draw(renderer);
      renderer.restore();
      if (time > 2) {
        arrows.delete(arrowInstance);
      }
      translation.x += heading.x * elapsedSeconds * 3000;
      translation.y += heading.y * elapsedSeconds * 3000;
      heading.y += elapsedSeconds;
      // Normalize heading.
      const length = heading.x * heading.x + heading.y * heading.y;
      if (length > 0) {
        const f = 1 / Math.sqrt(length);
        heading.x *= f;
        heading.y *= f;
      }
    }

    let removedApples = false;
    for (let appleInstance of Array.from(apples)) {
      const { artboard, machine, x, y } = appleInstance;

      renderer.save();
      renderer.translate(x, y);
      machine.advance(elapsedSeconds);
      const stateChangeCount = machine.stateChangedCount();
      for (let i = 0; i < stateChangeCount; i++) {
        if (machine.stateChangedNameByIndex(i) === "exit") {
          apples.delete(appleInstance);
          removedApples = true;
        }
      }
      artboard.advance(elapsedSeconds);
      artboard.draw(renderer);
      renderer.restore();
    }
    if (removedApples) {
      spawnApples();
    }

    renderer.restore();

    rive.requestAnimationFrame(draw);
  }
  rive.requestAnimationFrame(draw);

  canvas.onmousedown = function () {
    fireInput.fire();
    // asumes world scale matches.
    const transform = arrowLocation.worldTransform();
    const arrowInstance = {
      artboard: file.artboardByName("Arrow"),

      translation: {
        x: transform.tx + characterX,
        y: transform.ty,
      },
      heading: { x: transform.xx, y: transform.xy },
      time: 0,
    };
    arrowInstance.artboard.frameOrigin = false;
    arrowInstance.artboard.advance(0);
    arrows.add(arrowInstance);
  };

  window.onkeydown = function (ev) {
    if (ev.repeat) {
      return;
    }
    switch (ev.keyCode) {
      case 65:
        direction -= 1;
        break;
      case 68:
        direction += 1;
        break;
      default:
        break;
    }
  };

  window.onkeyup = function (ev) {
    if (ev.repeat) {
      return;
    }
    switch (ev.keyCode) {
      case 65:
        direction += 1;
        break;
      case 68:
        direction -= 1;
        break;
      default:
        break;
    }
  };

  window.onmousemove = function (ev) {
    cursorX = ev.offsetX;
    cursorY = ev.offsetY;
  };
}
main();
