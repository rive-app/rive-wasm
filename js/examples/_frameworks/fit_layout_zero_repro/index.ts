import "regenerator-runtime";
import { Rive, Fit, Alignment, Layout } from "@rive-app/canvas";

// Reuse the existing layout test asset from the sibling layout_example.
const RiveLayoutTest = new URL("/assets/layout_test.riv", import.meta.url);

async function loadRiveFile(): Promise<ArrayBuffer> {
  return await (await fetch(new Request(RiveLayoutTest))).arrayBuffer();
}

const logEl = document.getElementById("log") as HTMLPreElement;
const wrapper = document.getElementById("wrapper") as HTMLDivElement;
const canvas = document.getElementById("riveCanvas") as HTMLCanvasElement;
const canvasControl = document.getElementById(
  "riveCanvasControl",
) as HTMLCanvasElement;

interface RiveLike {
  artboardWidth: number;
  artboardHeight: number;
  resizeDrawingSurfaceToCanvas: () => void;
}

const log = (label: string, payload?: unknown) => {
  const t = performance.now().toFixed(0).padStart(5, " ");
  const line =
    `[${t}ms] ${label}` +
    (payload === undefined ? "" : "  " + JSON.stringify(payload));
  logEl.textContent += line + "\n";
  console.log("[repro]", label, payload);
};

const snapshot = (
  label: string,
  instance: RiveLike,
  canvasEl: HTMLCanvasElement,
) => {
  log(label, {
    artboard: { w: instance.artboardWidth, h: instance.artboardHeight },
    canvas: {
      cssW: canvasEl.clientWidth,
      cssH: canvasEl.clientHeight,
      backW: canvasEl.width,
      backH: canvasEl.height,
    },
  });
};

async function main() {
  const buffer = await loadRiveFile();

  // Control canvas — always visible. Baseline for the layout.
  const rControl = new Rive({
    canvas: canvasControl,
    buffer,
    layout: new Layout({ fit: Fit.Layout, alignment: Alignment.Center }),
    autoplay: true,
    stateMachines: ["State Machine 1"],
    onLoad: () => {
      rControl.resizeDrawingSurfaceToCanvas();
      snapshot(
        "[control] onLoad",
        rControl as unknown as RiveLike,
        canvasControl,
      );
    },
  }) as unknown as RiveLike;

  // Buggy canvas — mounts inside display:none, resize called in onLoad.
  // Realistic consumer pattern (matches layout_example/index.ts).
  const rive: RiveLike = new Rive({
    canvas,
    buffer,
    layout: new Layout({ fit: Fit.Layout, alignment: Alignment.Center }),
    autoplay: true,
    stateMachines: ["State Machine 1"],
    onLoad: () => {
      snapshot("[buggy] onLoad (before resize)", rive, canvas);
      // Bug 2 fires here when the canvas is inside display:none — the
      // Fit.Layout branch writes 0/scaleFactor into artboard.width/height.
      rive.resizeDrawingSurfaceToCanvas();
      snapshot("[buggy] onLoad (after resize)", rive, canvas);
    },
  }) as unknown as RiveLike;

  document.getElementById("show")!.addEventListener("click", () => {
    wrapper.classList.add("revealed");
    requestAnimationFrame(() => {
      requestAnimationFrame(() =>
        snapshot("[buggy] after reveal", rive, canvas),
      );
    });
  });

  document.getElementById("shrinkW")!.addEventListener("click", () => {
    // Width shrink 466 → 200 — non-zero → non-zero shift. Bug 1 drops it
    // so backing stays wide, CSS shrinks, browser stretches the bitmap →
    // visible horizontal squish.
    canvas.style.width = "200px";
    wrapper.style.width = "200px";
    requestAnimationFrame(() => {
      requestAnimationFrame(() =>
        snapshot("[buggy] shrink W to 200", rive, canvas),
      );
    });
  });

  document.getElementById("shrinkH")!.addEventListener("click", () => {
    // Height shrink with canvas backing forced to match CSS (mimicking a
    // `(window:resize)` listener). Artboard stays stale → Alignment.Center
    // clips top/bottom of the design.
    const newH = 55;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.height = newH + "px";
    wrapper.style.height = newH + "px";
    canvas.height = dpr * newH;
    canvas.width = dpr * canvas.clientWidth;
    requestAnimationFrame(() => {
      requestAnimationFrame(() =>
        snapshot(`[buggy] shrink H to ${newH}`, rive, canvas),
      );
    });
  });
}

main();
