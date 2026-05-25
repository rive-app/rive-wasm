# Fit.Layout — display:none-on-mount repro

Demonstrates two bugs in `@rive-app/canvas` 2.37.x that affect `Fit.Layout` consumers whose canvas mounts inside a hidden ancestor (skeleton/loader pattern):

1. **Bug 2 — `resizeDrawingSurfaceToCanvas` writes 0 to the artboard.** When the canvas is inside a `display:none` ancestor, `getBoundingClientRect()` returns `0×0`. The `Fit.Layout` branch blindly writes `0/scaleFactor` to `artboard.width` and `artboard.height`. The state machine then commits child positions against a zero-dimension layout box; the residue persists after the canvas later becomes visible.

2. **Bug 1 — `onCanvasResize` only re-fits on visibility toggle.** The `ResizeObserver` fires on every dimension change, but `onCanvasResize` collapses each event into a `hasZeroSize` boolean and only triggers `resizeDrawingSurfaceToCanvas()` when that boolean toggles. Non-zero → non-zero deltas (scrollbar appearance, sibling reflow, web font swap) are silently dropped, so `artboard.width/height` drift stale.

Both pages put two canvases side by side: a **control** (always visible, baseline rendering) and a **buggy** (mounts inside `display:none`, `resizeDrawingSurfaceToCanvas()` called in `onLoad`). The on-page log captures `artboard.width/height` and canvas dimensions at each step.

## Two ways to run

| File                      | Runtime source                                | Use case                                                                 |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `standalone.html`         | Published `@rive-app/canvas@2.37.6` via unpkg | Open immediately, no local build. Suitable as a GitHub issue attachment. |
| `index.html` (`index.ts`) | Local `../../../npm/canvas_single` build      | Verify the fix end-to-end by rebuilding after applying the patches.      |

Both files reuse `../layout_example/assets/layout_test.riv` — no asset duplication.

### Running `standalone.html`

```bash
cd js/examples/_frameworks
npx serve -l 8765 .          # or python3 -m http.server 8765
open http://localhost:8765/fit_layout_zero_repro/standalone.html
```

### Running `index.html` (parcel against the local build)

> **Requires emscripten + a built `npm/canvas_single` first.** If you don't have emscripten installed and just want to see the bug, use `standalone.html` above instead — it needs no local build. Without the WASM build, `npm start` will fail with `Could not load './rive.js' from module '@rive-app/canvas-single'` because `npm/canvas_single/rive.js` is a build artifact that doesn't ship in the repo.

```bash
# 1. (One-time) install emscripten — downloads SDK 3.1.61, ~5–15 min.
cd ../../wasm
./get_emcc.sh

# 2. Build the canvas_single bundle from the local (patched) source.
cd ../js
./build.sh -r canvas-single

# 3. Install parcel and serve.
cd examples/_frameworks/fit_layout_zero_repro
npm install
npm start                    # parcel: http://localhost:1234
```

## What the log shows

Pre-fix:

```text
[control] onLoad                       artboard:{w:466,h:70}   canvas:466×70
[buggy] onLoad (before resize)         artboard:{w:500,h:500}  canvas:0×0   ← design dimensions, healthy
[buggy] onLoad (after resize)          artboard:{w:0,h:0}      canvas:0×0   ← Bug 2 fired
[buggy] after reveal                   artboard:{w:466,h:70}   canvas:466×70 ← recovers via zero→nonzero toggle
[buggy] shrink W to 200                artboard:{w:466,h:70}   canvas:cssW:200, backW:466 ← Bug 1: backing not updated
[buggy] shrink H to 55                 artboard:{w:466,h:70}   canvas:466×55 ← Bug 1: artboard stale, top/bottom clipped
```

Post-fix:

```text
[buggy] onLoad (after resize)          artboard:{w:500,h:500}  ← Bug 2 fixed: 0×0 write skipped
[buggy] shrink W to 200                artboard:{w:200,h:70}   ← Bug 1 fixed: re-fit on dimension delta
[buggy] shrink H to 55                 artboard:{w:466,h:55}   ← Bug 1 fixed: re-fit on dimension delta
```

## Why the bug is intermittent in real apps

Bug 2 is timing-dependent: it fires only when `resizeDrawingSurfaceToCanvas()` is called while the canvas's ancestor is still `display:none`. That depends on race conditions — network latency for the `.riv` fetch, WASM init time, when the consumer's loading/skeleton state transitions, etc. Hard-refreshing the same page can give you the bug sometimes and a clean render other times.

Once Bug 2 fires, Bug 1 prevents recovery on subsequent layout shifts: even if the canvas later becomes visible, every further dimension change is silently dropped, so the artboard never re-fits.
