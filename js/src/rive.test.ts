import * as rive from './rive';

// #region setup and teardown

beforeEach(() => rive.RuntimeLoader.setTestMode(true));

afterEach(() => {});

// #endregion

// #region loop event tests


test('Creating loop event accepts valid loop values', () : void => {
  const event = rive.createLoopEvent('name', 0);
  expect(event).toBeDefined();
  expect(event.type).toBe(0);
  expect(event.name).toBe('oneShot');
  expect(event.animation).toBe('name');
});

test('Creating loop event throws on invalid loop values', () : void => {
    expect(() => rive.createLoopEvent('name', 4))
      .toThrow('Invalid loop value');
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

test('Layouts have sensible defaults', () : void => {
  let layout = new rive.Layout();
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(rive.Fit.None);
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

// #region helper functions

function printProperties(obj: any) {
  let propValue;
  for(let propName in obj) {
      propValue = obj[propName]

      console.log(propName, propValue);
  }
}

// #endregion