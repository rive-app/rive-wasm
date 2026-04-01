# Vite + TypeScript Rive Canvas Example

Minimal Vite app that loads a Rive file on a 500×500 canvas centered on the page, using the **locally built** `@rive-app/canvas` runtime.

## Setup

From the repo root, build the canvas runtime and install example deps:

```bash
# Build the canvas runtime (from runtime_wasm root or repo root as needed)
cd packages/runtime_wasm/wasm && ./build_all_wasm.sh
cd ../../js/examples/_frameworks/vite_canvas_centered
npm install
```

## Run

```bash
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). The Rive animation appears on a 500×500 canvas centered on the page.

## Build

```bash
npm run build
npm run preview
```

## Local Rive file

The example loads a file from the Rive CDN by default. To use your own file, put a `.riv` in `public/` (e.g. `public/sample.riv`) and in `main.ts` set:

```ts
const RIVE_FILE_URL = "/sample.riv";
```
