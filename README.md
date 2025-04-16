![Build Status](https://github.com/rive-app/rive-wasm/actions/workflows/build.yml/badge.svg)
![Discord badge](https://img.shields.io/discord/532365473602600965)
![Twitter handle](https://img.shields.io/twitter/follow/rive_app.svg?style=social&label=Follow)

# Rive Web

![Rive hero image](https://cdn.rive.app/rive_logo_dark_bg.png)

A JavaScript/TypeScript and Web Assembly ([WASM](https://developer.mozilla.org/en-US/docs/WebAssembly)) runtime library for [Rive](https://rive.app).

This library allows full control over Rive files with a high-level API for hooking up many simple interactions and animations, as well as a low-level API that allows you to drive your own render loop to create multiple artboards, animations, and state machines all in one canvas.

## Table of contents

- :star: [Rive Overview](#rive-overview)
- 🚀 [Getting Started & API docs](#getting-started)
- :mag: [Supported Browsers](#supported-browsers)
- :books: [Examples](#examples)
- :runner: [Migration Guides](#migration-guides)
- 👨‍💻 [Contributing](#contributing)
- :question: [Issues](#issues)

## Rive overview

[Rive](https://rive.app) is a real-time interactive design and animation tool that helps teams create and run interactive animations anywhere. Designers and developers use our collaborative editor to create motion graphics that respond to different states and user inputs. Our lightweight open-source runtime libraries allow them to load their animations into apps, games, and websites.

:house_with_garden: [Homepage](https://rive.app/)

:blue_book: [Rive docs](https://rive.app/docs/getting-started/introduction)

## Getting started

Follow along with the link below for a quick start in getting Rive JS integrated into your web applications.

- [Getting Started with Rive in Web](https://rive.app/docs/runtimes/web/web-js)
- [API documentation](https://rive.app/docs/runtimes/web/rive-parameters)

For more information, see the Runtime sections of the Rive help documentation:

- [Animation Playback](https://rive.app/docs/runtimes/animation-playback)
- [Layout](https://rive.app/docs/runtimes/layout)
- [State Machines](https://rive.app/docs/runtimes/state-machines)
- [Data Binding](https://rive.app/docs/runtimes/data-binding)
- [Rive Text](https://rive.app/docs/runtimes/text)
- [Rive Events](https://rive.app/docs/runtimes/rive-events)
- [Loading Assets](https://rive.app/docs/runtimes/loading-assets)

## Supported browsers

Rive can be used in all major browsers. We're constantly working to improve performance with our renderer so that animations playback smoothly for all.

## Examples

Check out some of the `examples/` projects in this codebase, as well as some of the CodeSandboxes below to see examples of using `rive-wasm`:

### High-level API usage

- [Simple displaying animation](https://codesandbox.io/s/rive-plain-js-sandbox-1ddrc?file=/src/index.js)
- [Rive with Listeners](https://codesandbox.io/s/rivewithlisteners-242drk)
- [Rive with State Machines](https://codesandbox.io/s/rive-web-state-machine-example-v33h3o)

### Low-level API usage

- [Constructing a render loop](https://codesandbox.io/s/rive-canvas-advanced-api-basketball-rgted8)
  - [Source code](https://github.com/rive-app/rive-wasm/tree/master/wasm/examples/parcel_example)
- [Centaur game](https://codesandbox.io/s/rive-canvas-advanced-api-centaur-example-exh2os?file=/src/index.ts)
  - [Source code](https://github.com/rive-app/rive-wasm/tree/master/wasm/examples/centaur_game)
  - [Rive community post](https://rive.app/community/1202-2351-the-centaur-and-the-apples/) - Inspect and download the accompanying Rive file for this example in the Rive community

### Awesome Rive

For even more examples and resources on using Rive at runtime or in other tools, checkout the [awesome-rive](https://github.com/rive-app/awesome-rive) repo.

## Migration guides

Using `rive-js` or an older version of the runtime and need to learn how to upgrade to the latest version? Check out the migration guides below in our help center that help guide you through major version bumps; breaking changes and all!

[Migration guides](https://rive.app/docs/runtimes/web/migrating-from-rive-js)

## Contributing

We love contributions! Check out our [contributing docs](./CONTRIBUTING.md) to get more details into how to run this project, the examples, and more all locally.

## Issues

Have an issue with using the runtime, or want to suggest a feature/API to help make your development life better? Log an issue in our [issues](https://github.com/rive-app/rive-wasm/issues) tab! You can also browse older issues and discussion threads there to see solutions that may have worked for common problems.
