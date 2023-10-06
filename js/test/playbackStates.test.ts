// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { pingPongRiveFileBuffer } from "./assets/bytes";

// #region playbackstates

test("Playback state for new Rive objects is pause", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    onLoad: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      expect(r.isPlaying).toBeFalsy();
      done();
    },
  });
});

test("Playback state for auto-playing new Rive objects is play", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onLoad: () => {
      // We expect things to be stopped right after loading
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      done();
    },
  });
});

// #endregion
