Lightweight Rive runtime for the Web using WASM and Canvas2D.

# Getting Started

## Browser

To use the library, run `npm install rive-canvas` and then simply include it:

    <script src="/node_modules/rive-canvas/rive.js"></script>
    Rive({
        locateFile: (file) => '/node_modules/rive-canvas/'+file,
    }).then((module) => {
        // Code goes here using Rive.
    });

As with all npm packages, there's a freely available CDN via unpkg.com:

    <script src="https://unpkg.com/rive-canvas@0.6.9/rive.js"></script>
    Rive({
         locateFile: (file) => 'https://unpkg.com/rive-canvas@0.6.9/'+file,
    }).then(...)
    
## In a Typescript Project

```typescript
import Rive, { File } from 'rive-canvas';

async function loadRivFile(filePath: string): Promise<File> {
  const req = new Request(filePath);
  const loadRive = Rive({ locateFile: (file) => '/node_modules/rive-canvas/' + file });
  const loadFile = fetch(req).then((res) => res.arrayBuffer()).then((buf) => new Uint8Array(buf));
  const [ rive, file ] = await Promise.all([ loadRive, loadFile ]);
  return rive.load(file);
}
```
