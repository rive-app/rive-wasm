/*
* High level API for playing Rive animationa
*/
'use strict';

const {
  Alignment,
  Fit,
  Layout,
  Rive } = require('./utils');

// Lets webpack know to copy the Wasm file to the dist folder
const _ = require('../../wasm/publish/rive.wasm');

// Exports needed to expose these for some reason as ES2015 export not working
if (typeof exports !== 'undefined') {
  exports.Rive = Rive;
  exports.Alignment = Alignment;
  exports.Fit = Fit;
  exports.Layout = Layout;
  // Exporting things to be tested
  // exports.testables = {
  //   createLoopEvent: LoopEvent
  // }
}

// Tie these to global/window for use directly in browser
if (typeof global !== 'undefined') {
  global.Rive = Rive;
  global.Rive.Alignment = Alignment;
  global.Rive.Fit = Fit;
  global.Rive.Layout = Layout;
} else if (typeof window !== 'undefined') {
  window.Rive = Rive;
  window.Rive.Alignment = Alignment;
  window.Rive.Fit = Fit;
  window.Rive.Layout = Layout;
}