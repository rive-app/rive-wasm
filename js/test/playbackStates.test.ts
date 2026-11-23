import * as rive from "../src/rive";
import { pingPongRiveFileBuffer } from "./assets/bytes";
import { loadRive, waitForPredicate } from "./helpers";

// #region playbackstates

test("Playback state for new Rive objects is pause", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
  });
  expect(r.isStopped).toBeFalsy();
  expect(r.isPaused).toBeTruthy();
  expect(r.isPlaying).toBeFalsy();
  r.cleanup();
});

test("Playback state for auto-playing new Rive objects is play", async () => {
  const canvas = document.createElement("canvas");
  const onPlay = jest.fn();
  const r = await loadRive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onPlay: onPlay,
  });
  // We expect things to be playing right after loading
  expect(r.isStopped).toBeFalsy();
  expect(r.isPaused).toBeFalsy();
  expect(r.isPlaying).toBeTruthy();

  // We expect the play event to fire shortly after load
  await waitForPredicate(() => onPlay.mock.calls.length > 0);
  expect(r.isStopped).toBeFalsy();
  expect(r.isPaused).toBeFalsy();
  expect(r.isPlaying).toBeTruthy();
  r.cleanup();
});

// #endregion
