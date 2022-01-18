import 'regenerator-runtime';
import RiveCanvas from '../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs';
// import RiveCanvas from '../../../js/npm/canvas_advanced_single/canvas_advanced_single.mjs';
import Animation from './hero-v6.riv';
import './main.css';

// Loads a default animation and displays it using the advanced api. Drag and
// drop .riv files to see them and play their default animations.
async function main() {

    const rive = await RiveCanvas();

    async function loadDefault() {
        const bytes = await (await fetch(new Request(Animation))).arrayBuffer();
        const file = rive.load(new Uint8Array(bytes));
        artboard = file.defaultArtboard();
        stateMachine = new rive.StateMachineInstance(artboard.stateMachineByIndex(0));
    }
    await loadDefault();

    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const renderer = rive.makeRenderer(canvas);

    window.onresize = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    function loadFile(droppedFile) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const file = rive.load(new Uint8Array(event.target.result));
            artboard = file.defaultArtboard();
            animation = new rive.LinearAnimationInstance(artboard.animationByIndex(0));
        }

        reader.readAsArrayBuffer(droppedFile);
    }


    document.body.addEventListener('dragover', function (ev) {
        ev.preventDefault();
    });
    document.body.addEventListener('drop', function (ev) {
        ev.preventDefault();

        if (ev.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                // If dropped items aren't files, reject them
                if (ev.dataTransfer.items[i].kind === 'file') {
                    loadFile(ev.dataTransfer.items[i].getAsFile());
                    break;
                }
            }
        } else {

            for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                loadFile(ev.dataTransfer.files[i]);
                break;
            }
        }

    });

    let lastTime = 0;
    let artboard, stateMachine;

    const times = [];
    const durations = [];

    function draw(time) {
        if (!lastTime) {
            lastTime = time;
        }
        const elapsedMs = time - lastTime;
        const elapsedSeconds = elapsedMs / 1000;
        lastTime = time;

        const before = performance.now()
        // Update fps
        while (times.length > 0 && times[0] <= time - 1000) {
            times.shift();
            durations.shift();
        }
        times.push(before);
        document.getElementById('fps-value').innerText = times.length;

        renderer.clear();
        if (artboard) {
            stateMachine.advance(artboard, elapsedSeconds);
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

        // Update frame time
        const after = performance.now();
        durations.push(after - before);
        // Use average of all recent durations
        document.getElementById('framems-value').innerText = (durations.reduce((p, n) => p + n, 0) / durations.length).toFixed(4);

        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);


}
main();