import { Rive, RuntimeLoader } from 'rive-js/dist/rive.lean.dev';
import wasmUrl from 'url:../../../dist/rive.wasm';

RuntimeLoader.setWasmUrl(wasmUrl);

new Rive({
  src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
  canvas: document.getElementById('canvas'),
  autoplay: true
});