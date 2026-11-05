![npm](https://img.shields.io/npm/v/@rive-app/canvas)
# Rive 
High-level Rive API using CanvasRenderingContext2D. Please see https://github.com/rive-app/rive-wasm for a list of all the available web runtimes and their details.

[Rive](https://rive.app) is an agent-native 2D and 3D engine for games, apps, and interactive UI. Use it as your whole engine, or add it to the products you already have. Build with your coding agent through the [Rive CLI](https://rive.app/agents), or draw, rig, and animate by hand with the professional design and animation tools in the [Rive Editor](https://rive.app/editor). Both work on the same files. Open-source runtimes, no royalties or runtime fees. Rive files (`.riv`) play natively on web, mobile, desktop, game engines, consoles, smart TVs, and cars.

## Canvas 
```
npm install @rive-app/canvas
```
An easy-to-use high-level Rive API using a backing [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) renderer. This lets Rive use the browser's native high-level vector graphics renderer. Some benefits of this package:
- Extremely small download size
- Great for displaying many animated canvases concurrently on the screen. This is ideal for when you want to render lists or grids of Rive animations on the screen, as there is no context limit by the browser (as opposed to WebGL)
- Support for simple vector graphics animations, raster, and mesh deformations
- Requests the Web Assembly (WASM) backing dependency for you

[Getting Started](https://github.com/rive-app/rive-wasm#getting-started)

## Build with your agent

Paste this into Claude Code, Codex, Cursor, or any agent that runs commands on your computer:

```text
Install the Rive CLI from rive.app/cli. Build an interactive hero for my website as a Rive file and add it to the page with the Rive web runtime.
```

Your agent installs the [Rive CLI](https://rive.app/agents), writes the scene, and opens a preview window that rebuilds every time it saves. Keep giving it notes, or open the same file in the [Rive Editor](https://editor.rive.app/) and shape it by hand. Trying it needs no account. Writing the `.riv` that ships on your site needs a free Rive account. Free exports play a short Rive splash screen; [paid plans](https://rive.app/pricing) export without it. See [Getting started with the Rive CLI](https://rive.app/docs/cli/getting-started).
