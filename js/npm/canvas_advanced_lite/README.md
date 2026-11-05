![npm](https://img.shields.io/npm/v/@rive-app/canvas-advanced-lite)

# Rive 
Low-level lite Rive API using CanvasRenderingContext2D. Please see https://rive.app/community/doc/canvas-vs-webgl/docanjXoQ1uT for a list of all the available web runtimes and their details.

[Rive](https://rive.app) is an agent-native 2D and 3D engine for games, apps, and interactive UI. Use it as your whole engine, or add it to the products you already have. Build with your coding agent through the [Rive CLI](https://rive.app/agents), or draw, rig, and animate by hand with the professional design and animation tools in the [Rive Editor](https://rive.app/editor). Both work on the same files. Open-source runtimes, no royalties or runtime fees. Rive files (`.riv`) play natively on web, mobile, desktop, game engines, consoles, smart TVs, and cars.

## Canvas Advanced 
```
npm install @rive-app/canvas-advanced-lite
```
A low-level Rive API using the [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) renderer. It has the same benefits as the regular `@rive-app/canvas` package plus:
- Full control over the update and render loop
- Allows for rendering multiple Rive artboards to a single canvas
- Allows deeper control and manipulation of the components in a Rive hierarchy
- Web Assembly (WASM) is part of the NPM bundle, but you load in the WASM manually

[Getting Started](https://rive.app/community/doc/low-level-api-usage/doctAfBY6v3P)

## Why Lite?

The complimentary `@rive-app/canvas-advanced` dependency supports all Rive features and contains the necessary backing dependencies to render those graphics. This `lite` version has the same API, but does not compile and build with certain dependencies in order to keep the package size as small as possible.

At this time, this lite version of `@rive-app/canvas-advanced-lite` will not render Rive Text onto the canvas or play Rive Audio. Note however, that even if your Rive file may include Rive Text components, rendering the graphic should not cause any app errors, or cease to render. The same is true for playing audio.

## Build with your agent

Paste this into Claude Code, Codex, Cursor, or any agent that runs commands on your computer:

```text
Install the Rive CLI from rive.app/cli. Build an interactive hero for my website as a Rive file and add it to the page with the Rive web runtime.
```

Your agent installs the [Rive CLI](https://rive.app/agents), writes the scene, and opens a preview window that rebuilds every time it saves. Keep giving it notes, or open the same file in the [Rive Editor](https://editor.rive.app/) and shape it by hand. Trying it needs no account. Writing the `.riv` that ships on your site needs a free Rive account. Free exports play a short Rive splash screen; [paid plans](https://rive.app/pricing) export without it. See [Getting started with the Rive CLI](https://rive.app/docs/cli/getting-started).
