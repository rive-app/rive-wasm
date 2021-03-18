const utils = require('./utils');
const Runtime = require('../../wasm/publish/rive.js');
import { EventType, EventListener, Event, RuntimeCallback } from './utils';

// #region setup and teardown

beforeEach(() => utils.RuntimeLoader.setTestMode(true));

afterEach(() => {});

// #endregion

// #region loop event tests


test('Creating loop event accepts valid loop values', () : void => {
  const event = utils.createLoopEvent('name', 0);
  expect(event).toBeDefined();
  expect(event.type).toBe(0);
  expect(event.name).toBe('oneShot');
  expect(event.animation).toBe('name');
});

test('Creating loop event throws on invalid loop values', () : void => {
    expect(() => utils.createLoopEvent('name', 4))
      .toThrow('Invalid loop value');
});

// #endregion

// #region layout tests

test('Layouts can be created with different fits and alignments', () : void => {
  let layout = new utils.Layout(utils.Fit.Contain, utils.Alignment.TopRight, 1, 2, 100, 101);
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(utils.Fit.Contain);
  expect(layout.alignment).toBe(utils.Alignment.TopRight);
  expect(layout.minX).toBe(1);
  expect(layout.minY).toBe(2);
  expect(layout.maxX).toBe(100);
  expect(layout.maxY).toBe(101);
});

test('Layouts have sensible defaults', () : void => {
  let layout = new utils.Layout();
  expect(layout).toBeDefined();
  expect(layout.fit).toBe(utils.Fit.None);
  expect(layout.alignment).toBe(utils.Alignment.Center);
  expect(layout.minX).toBe(0);
  expect(layout.minY).toBe(0);
  expect(layout.maxX).toBe(0);
  expect(layout.maxY).toBe(0);
});

test('Layouts provide runtime fit and alignment values', async () => {
  let rive = await utils.RuntimeLoader.awaitInstance();
  let layout = new utils.Layout(utils.Fit.FitWidth, utils.Alignment.BottomLeft);
  expect(layout).toBeDefined();
  expect(layout.runtimeFit(rive)).toBe(rive.Fit.fitWidth);
  expect(layout.runtimeAlignment(rive).x).toBe(rive.Alignment.bottomLeft.x);
  expect(layout.runtimeAlignment(rive).y).toBe(rive.Alignment.bottomLeft.y);
});

// #endregion

// #region runtime loading tests

test('Runtime can be loaded using callbacks', async done => {
  let rive : typeof Runtime;

  let callback1 : RuntimeCallback = (rive: typeof Runtime) : void => {
    expect(rive).toBeDefined();
    expect(rive.Fit.none).toBeDefined();
    expect(rive.Fit.cover).toBeDefined();
    expect(rive.Fit.none).not.toBe(rive.Fit.cover);
  };

  let callback2 : RuntimeCallback = (rive: typeof Runtime) : void => 
    expect(rive).toBeDefined();

  let callback3 : RuntimeCallback = (rive: typeof Runtime) : void => {
    expect(rive).toBeDefined();
    done();
  };

  utils.RuntimeLoader.getInstance(callback1);
  utils.RuntimeLoader.getInstance(callback2);
  // Delay 1 second to let library load
  setTimeout(() => utils.RuntimeLoader.getInstance(callback3), 500);
});

test('Runtime can be loaded using promises', async done => {
  let rive1 = await utils.RuntimeLoader.awaitInstance();
  expect(rive1).toBeDefined();
  expect(rive1.Fit.none).toBeDefined();
  expect(rive1.Fit.cover).toBeDefined();
  expect(rive1.Fit.none).not.toBe(rive1.Fit.cover);

  let rive2 = await utils.RuntimeLoader.awaitInstance();
  expect(rive2).toBeDefined;
  expect(rive2).toBe(rive1);

  setTimeout(async () => {
    let rive3 = await utils.RuntimeLoader.awaitInstance();
    expect(rive3).toBeDefined;
    expect(rive3).toBe(rive2);
    done();
  }, 500);
});

// #endregion 

// #region event tests

test('Events can be listened for and fired', () => {
  const manager = new utils.Testing.EventManager();
  expect(manager).toBeDefined();

  const mockFired = jest.fn();
  const listener: EventListener = {
    type: EventType.Load,
    callback: (e: Event) => {
      expect(e.type).toBe(EventType.Load);
      expect(e.message).toBe('fired');
      mockFired();
    }
  };
  
  manager.addListener(listener);
  manager.fireEvent({type: EventType.Load, message: 'fired'});
  expect(mockFired).toBeCalledTimes(1);
  
  manager.removeListener(listener);
  manager.fireEvent(EventType.Load, 'fired');
  expect(mockFired).toBeCalledTimes(1);

  manager.addListener(listener);
  manager.fireEvent({type: EventType.Load, message: 'fired'});
  expect(mockFired).toBeCalledTimes(2);
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