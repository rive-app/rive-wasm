import { Rive } from 'rive-js';

new Rive({
  src: 'https://cdn.rive.app/animations/off_road_car_v7.riv',
  canvas: document.getElementById('canvas'),
  autoplay: true
});