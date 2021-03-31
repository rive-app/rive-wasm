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

    <script src="https://unpkg.com/rive-canvas@latest/rive.js"></script>
    Rive({
         locateFile: (file) => 'https://unpkg.com/rive-canvas@latest/'+file,
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

## Webworker

You can use the `rive-canvas` inside a WebWorker to dissociate it from the main thread.

### OffscreenCanvas
In your main thread get the canvas element and transfer its control to an `OffscreenCanvas` :
```typescript
const el = document.getElemetById('rive');
if ('OffscreenCanvas' in window) {
    const canvas = el.transferControlToOffscreen();
    const ctx = this.canvas.getContext('2d');
    // Create a worker (see below)
    const worker = new Worker('rive.worker.js', { type: 'module'});
    // Create OffscreenCanvas & transfer it the canvas control
    const canvas = this.el.nativeElement.transferControlToOffscreen();
    const url = `assets/rive/knight.riv`;
    const animations = ['idle'];
    worker.postMessage({ canvas, url, animations }, [canvas]);
} else {
    // Do as usual
}
```

To learn more about `OffscreenCanvas` checkout this [article](https://developers.google.com/web/updates/2018/08/offscreen-canvas).

### Worker
Create a file `rive.worker.js` in which we are going to run the animation.
```typescript
import Rive from 'rive-canvas';

addEventListener('message', async ({ data }) => {
    const { canvas, url, animations } = data;

    // Load .riv file
    const req = new Request(url);
    const loadRive = Rive({ locateFile: (file: string) => 'https://unpkg.com/rive-canvas@latest/' + file, });
    const loadFile = fetch(req).then((res) => res.arrayBuffer());
    const [ rive, buf ] = await Promise.all([ loadRive, loadFile ]);
    const file = rive.load(new Uint8Array(buf));
    const artboard = file.defaultArtboard();

    // Associate CanvasRenderer with offset context
    const ctx = canvas.getContext('2d');
    const renderer = new rive.CanvasRenderer(ctx);

    // Move frame of each animation
    const animate = animations.map(name => {
        const animation = artboard.animationByName(name);
        const instance = new rive.LinearAnimationInstance(animation);
        return (delta: number) => {
            instance.advance(delta);
            instance.apply(artboard, 1.0);
        }
    });

    // Draw of the canvas
    let lastTime = 0;
    function draw(time: number) {
        if (!lastTime) lastTime = time;
    
        const delta = (time - lastTime) / 1000;
        lastTime = time;

        animate.forEach(cb => cb(delta))
        artboard.advance(delta);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        renderer.align(rive.Fit.contain, rive.Alignment.center, {
            minX: 0,
            minY: 0,
            maxX: canvas.width,
            maxY: canvas.height
        }, artboard.bounds);
        artboard.draw(renderer);
        ctx.restore();
        requestAnimationFrame(draw);
    }

    // Animation Frame run in the WebWorker
    requestAnimationFrame(draw);
});
```

The code above will be running in a new thread 🎉.
