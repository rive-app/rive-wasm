import 'regenerator-runtime';
import RiveCanvas from '../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs';
// import RiveCanvas from '../../../js/npm/canvas_advanced_single/canvas_advanced_single.mjs';
import MessageIcon from './message_icon.riv';
import Look from './look.riv';
import Tape from './tape.riv';
import './main.css';


const files = [MessageIcon, Look, Tape];
const useSkia = true;
// Loads a default animation and displays it using the advanced api. Drag and
// drop .riv files to see them and play their default animations.

class RiveCell {
    constructor(rive, file, useOffScreenRenderer) {
        const canvas =
            document.createElement("canvas");
        document.body.appendChild(canvas);

        canvas.height = canvas.width = 50 + Math.random() * 100;

        const renderer = rive.makeRenderer(canvas, useOffScreenRenderer);

        // window.onresize = function () {
        //     canvas.width = window.innerWidth;
        //     canvas.height = window.innerHeight;
        // };

        const artboard = file.defaultArtboard();
        // const stateMachine = new rive.StateMachineInstance(artboard.stateMachineByIndex(0));
        const animation = new rive.LinearAnimationInstance(artboard.animationByIndex(0));


        let lastTime = 0;

        function draw(time) {
            if (!lastTime) {
                lastTime = time;
            }
            const elapsedMs = time - lastTime;
            const elapsedSeconds = elapsedMs / 1000;
            lastTime = time;

            renderer.clear();
            if (artboard) {
                // if (stateMachine) {
                //     stateMachine.advance(artboard, elapsedSeconds);
                // } else if (animation) {
                animation.advance(elapsedSeconds);
                animation.apply(artboard, 1);
                // }
                artboard.advance(elapsedSeconds);
                renderer.save();
                renderer.align(rive.Fit.contain, rive.Alignment.center, {
                    minX: 0,
                    minY: 0,
                    maxX: canvas.width,
                    maxY: canvas.height
                }, artboard.bounds);
                artboard.draw(renderer);
                renderer.restore();

            }
            renderer.flush();

            requestAnimationFrame(draw);
        }
        requestAnimationFrame(draw);
    }
}

class ProxyRenderer {
    constructor(mega, canvas) {
        this.mega = mega;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

    }

    isOnScreen() {
        const rect = this.canvas.getBoundingClientRect();
        return rect.x + rect.width > 0 && rect.x < window.innerWidth && rect.y + rect.height > 0 && rect.y < window.innerHeight;
    }

    get realRenderer() {
        return this.mega.renderer;
    }

    clear() {
        this._amOnScreen = this.isOnScreen();
        if (!this._amOnScreen) {
            return;
        }
        // I know my size
        const {
            mega,
            canvas
        } = this;

        if (mega.canvas.width < canvas.width || mega.canvas.height < canvas.height) {
            mega.canvas.width = canvas.width;
            mega.canvas.height = canvas.height;
            mega.renderer.resize(canvas.width, canvas.height);
        }
        // console.log('wasm?', mega.renderer.clear)
        mega.renderer.clear();
    }

    save() {
        if (!this._amOnScreen) {
            return;
        }

        this.mega.renderer.save();
    }

    restore() {
        if (!this._amOnScreen) {
            return;
        }
        this.mega.renderer.restore();
    }

    transform(xform) {
        if (!this._amOnScreen) {
            return;
        }
        this.mega.renderer.transform(xform);
    }

    align(fit, align, from, to) {
        if (!this._amOnScreen) {
            return;
        }
        this.mega.renderer.align(fit, align, from, to);
    }

    computeAlignment(mat2d, fit, align, from, to) {
        this.mega.renderer.computeAlignment(mat2d, fit, align, from, to);
    }

    flush() {
        if (!this._amOnScreen) {
            return;
        }
        this.mega.renderer.flush();
        this.ctx.globalCompositeOperation = 'copy';
        this.ctx.drawImage(this.mega.canvas, 0, 0);
    }
}
class MegaRenderer {
    constructor(rive) {
        this.canvas =
            document.createElement("canvas");
        this.renderer = rive.makeRenderer(this.canvas);
    }
}
async function main() {
    // Load wasm
    const rive = await RiveCanvas();

    // Load file
    async function load(resource) {
        const bytes = await (await fetch(new Request(resource))).arrayBuffer();
        return rive.load(new Uint8Array(bytes));
    }

    const riveFiles = [];
    for (const resource of files) {
        riveFiles.push(await load(resource));
    }


    // Make special renderer.
    if (useSkia) {
        const megaRenderer = new MegaRenderer(rive);
        const originalRendererMaker = rive.makeRenderer;
        rive.makeRenderer = function (canvas, useOffScreenRenderer) {
            if (!useOffScreenRenderer) {
                return originalRendererMaker(canvas);
            }
            return new ProxyRenderer(megaRenderer, canvas);
        };

        const wasmDraw = rive.Artboard.prototype.draw;
        rive.Artboard.prototype.draw = function (renderer) {
            const realRenderer = renderer.realRenderer;
            if (realRenderer && !renderer.isOnScreen()) {
                return;
            }
            wasmDraw.call(this, realRenderer || renderer);
        };

    }

    // Make many instances
    const canvasCount = 250;
    const riveContexts = [];
    for (var i = 0; i < canvasCount; i++) {
        riveContexts.push(new RiveCell(rive, riveFiles[Math.floor(Math.random() * riveFiles.length)], i != 0));
    }
}
main();