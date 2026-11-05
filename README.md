![Build Status](https://github.com/rive-app/rive-wasm/actions/workflows/build.yml/badge.svg)
![Discord badge](https://img.shields.io/discord/532365473602600965)
![Twitter handle](https://img.shields.io/twitter/follow/rive_app.svg?style=social&label=Follow)

# Rive Web

![Rive hero image](https://cdn.rive.app/rive_logo_dark_bg.png)

A JavaScript/TypeScript and Web Assembly ([WASM](https://developer.mozilla.org/en-US/docs/WebAssembly)) runtime library for [Rive](https://rive.app).

This library allows full control over Rive files with a high-level API for hooking up many simple interactions and animations, as well as a low-level API that allows you to drive your own render loop to create multiple artboards, animations, and state machines all in one canvas.

## Table of contents

- :star: [Rive Overview](#rive-overview)
- 🤖 [Build with your agent](#build-with-your-agent)
- 🚀 [Getting Started & API docs](#getting-started)
- :mag: [Supported Browsers](#supported-browsers)
- :thread: [Threads and the replay worker](#threads-and-the-replay-worker)
- :books: [Examples](#examples)
- :runner: [Migration Guides](#migration-guides)
- 👨‍💻 [Contributing](#contributing)
- :question: [Issues](#issues)

## Rive overview

[Rive](https://rive.app) is an agent-native 2D and 3D engine for games, apps, and interactive UI. Use it as your whole engine, or add it to the products you already have. Build with your coding agent through the [Rive CLI](https://rive.app/agents), or draw, rig, and animate by hand with the professional design and animation tools in the [Rive Editor](https://rive.app/editor). Both work on the same files. Open-source runtimes, no royalties or runtime fees. Rive files (`.riv`) play natively on web, mobile, desktop, game engines, consoles, smart TVs, and cars.

:house_with_garden: [Homepage](https://rive.app/)

:blue_book: [Rive docs](https://rive.app/docs/getting-started/introduction)

## Build with your agent

Paste this into Claude Code, Codex, Cursor, or any agent that runs commands on your computer:

```text
Install the Rive CLI from rive.app/cli. Build an interactive hero for my website as a Rive file and add it to the page with the Rive web runtime.
```

Your agent installs the [Rive CLI](https://rive.app/agents), writes the scene, and opens a preview window that rebuilds every time it saves. Keep giving it notes, or open the same file in the [Rive Editor](https://editor.rive.app/) and shape it by hand. Trying it needs no account. Writing the `.riv` that ships on your site needs a free Rive account. Free exports play a short Rive splash screen; [paid plans](https://rive.app/pricing) export without it. See [Getting started with the Rive CLI](https://rive.app/docs/cli/getting-started).

## Getting started

Follow along with the link below for a quick start in getting Rive JS integrated into your web applications.

- [Getting Started with Rive in Web](https://rive.app/docs/runtimes/web/web-js)
- [API documentation](https://rive.app/docs/runtimes/web/rive-parameters)

For more information, see the Runtime sections of the Rive help documentation:

- [Layout](https://rive.app/docs/runtimes/layout)
- [State Machines](https://rive.app/docs/runtimes/state-machines)
- [Data Binding](https://rive.app/docs/runtimes/data-binding)
- [Rive Events](https://rive.app/docs/runtimes/rive-events)
- [Loading Assets](https://rive.app/docs/runtimes/web/loading-assets)

## Supported browsers

Rive can be used in all major browsers. We're constantly working to improve performance with our renderer so that animations playback smoothly for all.

## Threads and the replay worker

`@rive-app/webgl2-threads` loads a threaded build on pages that are cross origin isolated. There, instances created with `enableGPUCanvas: true` hand their canvas to one worker shared by every instance on the page: each frame advances and records on the page's thread while the worker replays the previous frame on the GPU, so the two no longer add up on the page's thread. This is on by default wherever the browser can draw WebGL2 on a transferred `OffscreenCanvas`. Safari 26.2 to 26.3.1 get the build without threads, since their threads lose each other's heap growth.

- Turn it off for the whole page with `RuntimeLoader.setReplayWorker(false)` before the runtime loads, or for one instance with `useReplayWorker: false`. Both keep replay on the page's thread, as do builds without threads, pages that are not isolated, and browsers without WebGL2 on `OffscreenCanvas`.
- A canvas handed to the worker stays with it. Setting its `width` and `height` properties still resizes it (the browser owns its attributes from then on), but the page can no longer get a context from it, and any later instance on that canvas renders through the worker too, reusing the same WebGL context.
- Images in those files decode on the worker, off the page's thread.
- The page records at most two frames ahead of the worker and skips a frame rather than queue more; the next frame advances by the time skipped.

## Examples

Check out some of the demos using this JS/WASM runtime in the [Rive documentation](https://rive.app/docs/runtimes/demos).

### Awesome Rive

For even more examples and resources on using Rive at runtime or in other tools, checkout the [awesome-rive](https://github.com/rive-app/awesome-rive) repo.

## Migration guides

Using an older version of the runtime and need to learn how to upgrade to the latest version? Check out the migration guides below in our help center that help guide you through major version bumps; breaking changes and all!

[Migration guides](https://rive.app/docs/runtimes/web/migration-guides)

## Contributing

We love contributions! Check out our [contributing docs](./CONTRIBUTING.md) to get more details into how to run this project, the examples, and more all locally.

## Issues

Have an issue with using the runtime, or want to suggest a feature/API to help make your development life better? Log an issue in our [issues](https://github.com/rive-app/rive-wasm/issues) tab! You can also browse older issues and discussion threads there to see solutions that may have worked for common problems.
