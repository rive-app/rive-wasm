<script lang="ts">
  import { onMount } from 'svelte';
  import { EventType, Rive } from '@rive-app/canvas';
  import type {Event, RiveEventPayload, StateMachineInput} from '@rive-app/canvas';
  import type { SpotifyApi, PlayHistory, PlaybackState } from "@spotify/web-api-ts-sdk";
  import {throttle} from './utils';

  // Props
  export let sdk: SpotifyApi | null;

  // Spotify state
  let resultItems: PlayHistory[];
  let device: string | null;
  let trackIdx = 0;
  let currentTrackData: PlaybackState;
  let totalTrackTimeMs = 0;
  $: currentTrackProgress = 0;
  
  // Rive state
  let riveInstance: Rive;
  let pollingIntervalId: number;
  let trackProgressInput: StateMachineInput;


  // Call Spotify APIs to get 5 recent tracks, current playing track, and devices to play on
  async function getRecentlyPlayedTracks() {
    if (riveInstance && sdk) {
      const results = await sdk.player.getRecentlyPlayedTracks(5);
      const trackResult = await sdk.player.getCurrentlyPlayingTrack();
      const dResults = await sdk.player.getAvailableDevices();
      resultItems = results.items;
      device = dResults.devices?.[0].id;
      currentTrackData = trackResult;
    }
  }

  $: {
    if (!resultItems || !device || !sdk) {
      getRecentlyPlayedTracks();
    }
  }

  // Format the number for Rive text
  function formatNumber(time: number) {
    const truncTime = Math.trunc(time);
    const timeStr = truncTime.toString();
    return timeStr.length === 1 ? timeStr.padStart(2, '0') : timeStr;
  }

  // Update the time text and a progress input every second
  async function pollCurrentPlay() {
    if (sdk) {
      const currentStartTime = currentTrackProgress + 1000;
      currentTrackProgress += 1000;
      if (currentTrackProgress >= totalTrackTimeMs) {
        const endDurationMin = ((totalTrackTimeMs / 1000) / 60) % 60;
        const endDurationSec = ((totalTrackTimeMs / 1000) % 60);
        riveInstance.setTextRunValue("timeStart", `${Math.trunc(endDurationMin)}:${formatNumber(endDurationSec)}`);
      } else {
        const startDurationMin = ((currentStartTime / 1000) / 60) % 60;
        const startDurationSec = ((currentStartTime / 1000) % 60);
        riveInstance.setTextRunValue("timeStart", `${Math.trunc(startDurationMin)}:${formatNumber(startDurationSec)}`);
      }

      const trackProgressPct = Math.floor((currentStartTime / totalTrackTimeMs) * 100);
      trackProgressInput.value = trackProgressPct;
    }
  }

  // Meant for initialization and new track updates (via updated trackIdx)
  $: {
    if (resultItems && device && riveInstance) {
      // const trackData = currentTrackData ? (currentTrackData.item as Track) : resultItems[trackIdx].track;
      const trackData = resultItems[trackIdx].track;
      const trackName = trackData.name;
      const artistNames = trackData.artists.reduce((acc, artist, idx) => {
        if (idx !== 0) {
          return acc + `, ${artist.name}`;
        } else {
          return acc + artist.name;
        }
      }, "");
      riveInstance.setTextRunValue("track", trackName);
      riveInstance.setTextRunValue("trackDummy", trackName);
      riveInstance.setTextRunValue("artist", artistNames);
      riveInstance.setTextRunValue("timeStart", `0:00`);

      const endDurationMin = ((trackData.duration_ms / 1000) / 60) % 60;
      const endDurationSec = ((trackData.duration_ms / 1000) % 60);
      totalTrackTimeMs = trackData.duration_ms;
      riveInstance.setTextRunValue("timeEnd", `${Math.trunc(endDurationMin)}:${formatNumber(endDurationSec)}`);
    }
  }

  // Event handler for Rive events (i.e. playback controls)
  async function onReceivedRiveEvent(event: Event) {
    if (!event || !sdk || !device) {
      return;
    }
    const riveEvent = (event.data as RiveEventPayload);
    switch (riveEvent.name) {
      case 'playbackEvent': {
        const isPlaying = (riveEvent.properties)?.isPlaying;
        const trackData = resultItems[trackIdx].track;
        if (isPlaying) {
          const playbackState = await sdk.player.getPlaybackState();
          if (!pollingIntervalId) {
            await sdk.player.startResumePlayback(device, undefined, [
              trackData.uri,
            ], undefined, playbackState?.progress_ms);
            currentTrackProgress = 0;
          } else {
            await sdk.player.startResumePlayback(device);
          }
          pollingIntervalId = window.setInterval(pollCurrentPlay, 1000);
        } else {
          await sdk.player.pausePlayback(device);
          clearInterval(pollingIntervalId);
        }
        break;
      }
      case 'nextTrackHit': {
        if (trackIdx >= 4) {
          trackIdx = 0;
        } else {
          trackIdx++;
        }
        currentTrackProgress = 0;
        const trackData = resultItems[trackIdx].track;
        await sdk.player.startResumePlayback(device, undefined, [
          trackData.uri,
        ]);
        break;
      }
      case 'prevTrackHit': {
        if (trackIdx <= 0) {
          trackIdx = 4;
        } else {
          trackIdx--;
        }
        currentTrackProgress = 0;
        const trackData = resultItems[trackIdx].track;
        await sdk.player.startResumePlayback(device, undefined, [
          trackData.uri,
        ]);
        break;
      }
      case 'volumeAdjusted': {
        if ('level' in (riveEvent.properties || {})) {
          const volumeLevel = riveEvent.properties!.level as number;
          const mappedSpotifyVolume = (100 * volumeLevel) / 11;
          await sdk.player.setPlaybackVolume(Math.round(mappedSpotifyVolume));
        }
        break;
      }
      default: {
        console.warn("Unhandled Event", riveEvent);
      }
    }
  }

  function initializeRive() {
    const canvasContainerEl = document.querySelector(".rive-container") as HTMLDivElement;
    const canvasEl = document.getElementById("rive-canvas") as HTMLCanvasElement;

    riveInstance = new Rive({
      src: '/digital_music_player.riv',
      autoplay: true,
      stateMachines: "State Machine 1",
      canvas: canvasEl,
      onLoad: () => {
        riveInstance.resizeDrawingSurfaceToCanvas();

        // Set text to empty initially
        riveInstance.setTextRunValue("track", "");
        riveInstance.setTextRunValue("trackDummy", "");
        riveInstance.setTextRunValue("artist", "");
        riveInstance.setTextRunValue("timeStart", "");

        const inputs = riveInstance.stateMachineInputs("State Machine 1");
        trackProgressInput = inputs.find((input) => input.name === "trackProgress")!;
      },
    });
    riveInstance.on(EventType.RiveEvent, onReceivedRiveEvent);

    const resizeObserver = new ResizeObserver(
      throttle(() => {
        //Get the block size
        if (!!riveInstance && canvasContainerEl) {
          const newWidth = canvasContainerEl.clientWidth;
          const newHeight = canvasContainerEl.clientHeight;
          const dpr = window.devicePixelRatio;
          if (canvasEl) {
            const newCanvasWidth = dpr * newWidth;
            const newCanvasHeight = dpr * newHeight;
            canvasEl.width = newCanvasWidth;
            canvasEl.height = newCanvasHeight;
            canvasEl.style.width = `${newWidth}px`;
            canvasEl.style.height = `${newHeight}px`;
            riveInstance!.resizeToCanvas();
            riveInstance!.startRendering();
          }
        }
      }, 0)
    );

    resizeObserver.observe(canvasContainerEl);
  }

  onMount(() => {
    initializeRive();
  })
</script>

<div class="rive-container">
  <canvas id="rive-canvas"></canvas>
</div>

<style>
  .rive-container {
    aspect-ratio: 1 / 1;
    width: 80vw;
    height: 80vh;
  }

  #rive-canvas {
    width: 100%;
    height: 100%;
  }
</style>