import * as rive from './rive';

// #region helper functions

/**
 * Convert string to array buffer.
 *
 * @param {Array.<int>} array
 * @returns {ArrayBuffer}
 */
 const arrayToArrayBuffer = ( array: number[] ): ArrayBuffer => {
  const length = array.length;
  const buffer = new ArrayBuffer( length );
  const view = new Uint8Array(buffer);
  for ( let i = 0; i < length; i++) {
      view[i] = array[i];
  }
  return buffer;
}

const printProperties = (obj: any): void => {
  let propValue;
  for(let propName in obj) {
      propValue = obj[propName]

      console.log(propName, propValue);
  }
}

// #endregion

// #region test data

const corruptRiveFileBytes = [0x43, 0x67, 0xAC, 0x00, 0xFF, 0x2E];
const corruptRiveFileBuffer = arrayToArrayBuffer(corruptRiveFileBytes);

const pingPongRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8B, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01, 0x07, 0x00, 0x00, 
  0xFA, 0x43, 0x08, 0x00, 0x00, 0xFA, 0x43, 0x04, 0x0C, 0x4E, 0x65, 0x77, 0x20, 0x41, 0x72, 0x74, 
  0x62, 0x6F, 0x61, 0x72, 0x64, 0x00, 0x03, 0x05, 0x00, 0x0D, 0x00, 0x00, 0x7A, 0x43, 0x0E, 0x00, 
  0x00, 0x7A, 0x43, 0x00, 0x07, 0x05, 0x01, 0x14, 0xEA, 0xA3, 0xC7, 0x42, 0x15, 0xEA, 0xA3, 0xC7, 
  0x42, 0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00, 0x12, 0x05, 
  0x05, 0x25, 0x31, 0x31, 0x31, 0xFF, 0x00, 0x1F, 0x37, 0x0B, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74, 
  0x69, 0x6F, 0x6E, 0x20, 0x31, 0x39, 0x0A, 0x3B, 0x02, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35, 
  0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0xE8, 0xA3, 0x47, 0x42, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 
  0x46, 0x83, 0x0B, 0xE1, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x00, 0x00, 
  0x7A, 0x43, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7A, 0x43, 0x00
];
const pingPongRiveFileBuffer = arrayToArrayBuffer(pingPongRiveFileBytes);

const oneShotRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8B, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01, 0x07, 0x00, 0x00, 
  0xFA, 0x43, 0x08, 0x00, 0x00, 0xFA, 0x43, 0x04, 0x0C, 0x4E, 0x65, 0x77, 0x20, 0x41, 0x72, 0x74, 
  0x62, 0x6F, 0x61, 0x72, 0x64, 0x00, 0x03, 0x05, 0x00, 0x0D, 0x00, 0x00, 0x7A, 0x43, 0x0E, 0x00, 
  0x00, 0x7A, 0x43, 0x00, 0x07, 0x05, 0x01, 0x14, 0xEA, 0xA3, 0xC7, 0x42, 0x15, 0xEA, 0xA3, 0xC7, 
  0x42, 0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00, 0x12, 0x05, 
  0x05, 0x25, 0x31, 0x31, 0x31, 0xFF, 0x00, 0x1F, 0x37, 0x0B, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74, 
  0x69, 0x6F, 0x6E, 0x20, 0x31, 0x39, 0x0A, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35, 0x0D, 0x00, 
  0x1E, 0x44, 0x01, 0x46, 0xE8, 0xA3, 0x47, 0x42, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 0x46, 0x83, 
  0x0B, 0xE1, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7A, 0x43, 
  0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7A, 0x43, 0x00
];
const oneShotRiveFileBuffer = arrayToArrayBuffer(oneShotRiveFileBytes);

const loopRiveFileBytes = [
  0x52, 0x49, 0x56, 0x45, 0x07, 0x00, 0x8B, 0x94, 0x02, 0x00, 0x17, 0x00, 0x01, 0x07, 0x00, 0x00, 
  0xFA, 0x43, 0x08, 0x00, 0x00, 0xFA, 0x43, 0x04, 0x0C, 0x4E, 0x65, 0x77, 0x20, 0x41, 0x72, 0x74, 
  0x62, 0x6F, 0x61, 0x72, 0x64, 0x00, 0x03, 0x05, 0x00, 0x0D, 0x00, 0x00, 0x7A, 0x43, 0x0E, 0x00, 
  0x00, 0x7A, 0x43, 0x00, 0x07, 0x05, 0x01, 0x14, 0xEA, 0xA3, 0xC7, 0x42, 0x15, 0xEA, 0xA3, 0xC7, 
  0x42, 0x00, 0x14, 0x05, 0x01, 0x00, 0x12, 0x05, 0x03, 0x00, 0x14, 0x05, 0x00, 0x00, 0x12, 0x05, 
  0x05, 0x25, 0x31, 0x31, 0x31, 0xFF, 0x00, 0x1F, 0x37, 0x0B, 0x41, 0x6E, 0x69, 0x6D, 0x61, 0x74, 
  0x69, 0x6F, 0x6E, 0x20, 0x31, 0x39, 0x0A, 0x3B, 0x01, 0x00, 0x19, 0x33, 0x01, 0x00, 0x1A, 0x35, 
  0x0D, 0x00, 0x1E, 0x44, 0x01, 0x46, 0xE8, 0xA3, 0x47, 0x42, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 
  0x46, 0x83, 0x0B, 0xE1, 0x43, 0x00, 0x1A, 0x35, 0x0E, 0x00, 0x1E, 0x44, 0x01, 0x46, 0x00, 0x00, 
  0x7A, 0x43, 0x00, 0x1E, 0x43, 0x0A, 0x44, 0x01, 0x46, 0x00, 0x00, 0x7A, 0x43, 0x00
];
const loopRiveFileBuffer = arrayToArrayBuffer(loopRiveFileBytes);

// #endregion

// #region setup and teardown

beforeEach(() => {
  // Suppress console.warn and console.error
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  rive.RuntimeLoader.setTestMode(true);
});

afterEach(() => {});

// #endregion

// #region loop event tests

test('Creating loop event accepts enum and string values', () : void => {
  let loopEvent: rive.LoopEvent = {animation: 'test animation', type: rive.LoopType.PingPong}; 
  expect(loopEvent.type).toBe('pingpong');

  loopEvent = {animation: 'test animation', type: rive.LoopType.OneShot}; 
  expect(loopEvent.type).toBe('oneshot');
});

// #endregion

// #region layout tests

test('Layouts can be created with different fits and alignments', () : void => {
  let layout = new rive.Layout(rive.Fit.Contain, rive.Alignment.TopRight, 1, 2, 100, 101);
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.TopRight);
  expect(layout.minX).toBe(1);
  expect(layout.minY).toBe(2);
  expect(layout.maxX).toBe(100);
  expect(layout.maxY).toBe(101);
});

test('Layouts can be created with named parameters', () : void => {
  let layout = rive.Layout.new({
    minX: 1, alignment: rive.Alignment.TopRight,
    minY: 2, fit: rive.Fit.Contain, maxX: 100, maxY: 101
  });
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.TopRight);
  expect(layout.minX).toBe(1);
  expect(layout.minY).toBe(2);
  expect(layout.maxX).toBe(100);
  expect(layout.maxY).toBe(101);
});

test('Layouts have sensible defaults', () : void => {
  let layout = new rive.Layout();
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.Contain);
  expect(layout.alignment).toBe(rive.Alignment.Center);
  expect(layout.minX).toBe(0);
  expect(layout.minY).toBe(0);
  expect(layout.maxX).toBe(0);
  expect(layout.maxY).toBe(0);
});

test('Layouts provide runtime fit and alignment values', async () => {
  const runtime: any = await rive.RuntimeLoader.awaitInstance();
  let layout = new rive.Layout(rive.Fit.FitWidth, rive.Alignment.BottomLeft);
  expect(layout).toBeDefined();
  expect(layout.runtimeFit(runtime)).toBe(runtime.Fit.fitWidth);
  expect(layout.runtimeAlignment(runtime).x).toBe(-1);
  expect(layout.runtimeAlignment(runtime).y).toBe(1);

  layout = new rive.Layout(rive.Fit.Fill, rive.Alignment.TopRight);
  expect(layout).toBeDefined();
  expect(layout.runtimeFit(runtime)).toBe(runtime.Fit.fill);
  expect(layout.runtimeAlignment(runtime).x).toBe(1);
  expect(layout.runtimeAlignment(runtime).y).toBe(-1);
});

// #endregion

// #region runtime loading tests

test('Runtime can be loaded using callbacks', async done => {

  let callback1 : rive.RuntimeCallback = (runtime: any) : void => {
    expect(runtime).toBeDefined();
    expect(runtime.Fit.none).toBeDefined();
    expect(runtime.Fit.cover).toBeDefined();
    expect(runtime.Fit.none).not.toBe(runtime.Fit.cover);
  };

  let callback2 : rive.RuntimeCallback = (runtime: any) : void => 
    expect(runtime).toBeDefined();

  let callback3 : rive.RuntimeCallback = (runtime: any) : void => {
    expect(runtime).toBeDefined();
    done();
  };

  rive.RuntimeLoader.getInstance(callback1);
  rive.RuntimeLoader.getInstance(callback2);
  // Delay 1 second to let library load
  setTimeout(() => rive.RuntimeLoader.getInstance(callback3), 500);
});

test('Runtime can be loaded using promises', async done => {
  let rive1:any = await rive.RuntimeLoader.awaitInstance();
  expect(rive1).toBeDefined();
  expect(rive1.Fit.none).toBeDefined();
  expect(rive1.Fit.cover).toBeDefined();
  expect(rive1.Fit.none).not.toBe(rive1.Fit.cover);

  let rive2 = await rive.RuntimeLoader.awaitInstance();
  expect(rive2).toBeDefined;
  expect(rive2).toBe(rive1);

  setTimeout(async () => {
    let rive3 = await rive.RuntimeLoader.awaitInstance();
    expect(rive3).toBeDefined;
    expect(rive3).toBe(rive2);
    done();
  }, 500);
});

// #endregion 

// #region event tests

test('Events can be listened for and fired', () => {
  const manager = new rive.Testing.EventManager();
  expect(manager).toBeDefined();

  const mockFired = jest.fn();
  const listener: rive.EventListener = {
    type: rive.EventType.Load,
    callback: (e: rive.Event) => {
      expect(e.type).toBe(rive.EventType.Load);
      expect(e.data).toBe('fired');
      mockFired();
    }
  };
  
  manager.add(listener);
  manager.fire({type: rive.EventType.Load, data: 'fired'});
  expect(mockFired).toBeCalledTimes(1);
  
  manager.remove(listener);
  manager.fire({type: rive.EventType.Load, data: 'fired'});
  expect(mockFired).toBeCalledTimes(1);

  manager.add(listener);
  manager.fire({type: rive.EventType.Load, data: 'fired'});
  expect(mockFired).toBeCalledTimes(2);
});

// #endregion

// #region task queue tests

test('Tasks are queued and run when processed', () => {
  const eventManager = new rive.Testing.EventManager();
  const taskManager = new rive.Testing.TaskQueueManager(eventManager);

  const mockFired = jest.fn();
  const listener: rive.EventListener = {
    type: rive.EventType.Play,
    callback: (e: rive.Event) => {
      expect(e.type).toBe(rive.EventType.Play);
      expect(e.data).toBe('play');
      mockFired();
    }
  };
  eventManager.add(listener);
  const event: rive.Event = {type: rive.EventType.Play, data: 'play'};

  const mockAction: rive.ActionCallback = jest.fn();
  const task: rive.Task = {event: event, action: mockAction};
  taskManager.add(task);

  taskManager.process();
  expect(mockAction).toBeCalledTimes(1);
  expect(mockFired).toBeCalledTimes(1);

  taskManager.add(task);
  taskManager.add(task);
  taskManager.process();
  expect(mockAction).toBeCalledTimes(3);
  expect(mockFired).toBeCalledTimes(3);
});

// #endregion

// #region creating Rive objects

test('Rive objects require a src url or byte buffer', () => {
  const canvas = document.createElement('canvas');
  const badConstructor = () => {
    new rive.Rive(canvas);
  };
  expect(badConstructor).toThrow(Error);
});

test('Rive objects initialize correctly', done => {
  const canvas = document.createElement('canvas');
  const r = rive.Rive.new({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    onload: () => {
      expect(r).toBeDefined();
      done();
    },
    onloaderror: () => expect(false).toBeTruthy(),
  });
});

test('Corrupt Rive file cause explosions',  done => {
  const canvas = document.createElement('canvas');
  const r = rive.Rive.new({
    canvas: canvas,
    buffer: corruptRiveFileBuffer,
    onloaderror: () => done(),
    onload: () => expect(false).toBeTruthy()
  });
});

// #endregion

// #region playbackstates

test('Playback state for new Rive objects is stop',  done => {
  const canvas = document.createElement('canvas');
  const r = rive.Rive.new({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    onload: () => {
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      done();
    }
  });
});

test('Playback state for auto-playing new Rive objects is play',  done => {
  const canvas = document.createElement('canvas');
  const r = rive.Rive.new({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onload: () => {
      // We expect things to be stopped right after loading
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
    },
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      done();
    }
  });
});

// #endregion

// #region Firing events

test('Playing a ping-pong animation will fire a loop event',  done => {
  const canvas = document.createElement('canvas');
  const r = rive.Rive.new({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onloop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Loop);
      expect(event.data).toBeDefined();
      expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.PingPong);
      done();
    },
  });
});

test('Playing a loop animation will fire a loop event',  done => {
  const canvas = document.createElement('canvas');
  const r = rive.Rive.new({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onloop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Loop);
      expect(event.data).toBeDefined();
      expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.Loop);
      done();
    },
  });
});

test('Playing a one-shot animation will fire a stop event',  done => {
  const canvas = document.createElement('canvas');
  const r = rive.Rive.new({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onstop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Stop);
      done();
    },
  });
});

// #endregion

// #region loading files

test('Multiple files can be loaded and played',  done => {
  const canvas = document.createElement('canvas');
  let loopOccurred = false;

  const r = rive.Rive.new({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onload: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeTruthy();
    },
    onplay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onloop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(loopOccurred).toBeFalsy();
      loopOccurred = true;
      // After the first loop, load a new file
      r.load({buffer: oneShotRiveFileBuffer, autoplay: true});
    },
    onstop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(loopOccurred).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Stop);
      done();
    },
  });
});

// @endregion