import 'regenerator-runtime';
import RiveCanvas from '../../../js/npm/webgl_advanced_single/webgl_advanced_single.mjs';
import './main.css';

// Loads a default animation and displays it using the advanced api. Drag and
// drop .riv files to see them and play their default animations.
async function main() {

    const rive = await RiveCanvas();

    async function loadDefault() {
        const bytes = await (await fetch(new Request('https://cdn.rive.app/animations/vehicles.riv'))).arrayBuffer();
        const file = rive.load(new Uint8Array(bytes));
        artboard = file.defaultArtboard();
        animation = new rive.LinearAnimationInstance(artboard.animationByIndex(0));
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
    let artboard, animation;

    function draw(time) {
        if (!lastTime) {
            lastTime = time;
        }
        const elapsedSeconds = (time - lastTime) / 1000;
        lastTime = time;
        renderer.clear();
        if (artboard) {
            animation.advance(elapsedSeconds);
            animation.apply(artboard, 1);
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
main();