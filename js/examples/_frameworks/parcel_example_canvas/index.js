import "regenerator-runtime";
import {Rive} from '@rive-app/canvas';

async function main() {
  const r0 = new Rive({
    src: "https://public.rive.app/community/runtime-files/2195-4346-avatar-pack-use-case.riv",
    autoplay: true,
    canvas: document.getElementById('canvas0'),
    animations: ['idle'],
  });

  const r1 = new Rive({
    src: "https://public.rive.app/community/runtime-files/2063-4080-flutter-puzzle-hack-project.riv",
    autoplay: true,
    canvas: document.getElementById('canvas1'),
    animations: ['idle'],
  });

  const r2 = new Rive({
    src: "https://public.rive.app/community/runtime-files/2323-4608-wolvie-v2.riv",
    autoplay: true,
    canvas: document.getElementById('canvas2'),
  });
}

main();
