const utils = require('./utils');
const Rive = require('../../wasm/publish/rive.js')

import { doesNotMatch } from 'node:assert';
import { RuntimeCallback, RuntimeLoader } from './utils';

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
  const rive = await Rive({});
  let layout = new utils.Layout();
  expect(layout).toBeDefined();
});

// #endregion

// #region runtime loading tests

test('Runtime can be loaded using callbacks', async done => {
  let rive : typeof Rive;

  let callback1 : RuntimeCallback = (rive: typeof Rive) : void => {
    expect(rive).toBeDefined();
    expect(rive.Fit.none).toBeDefined();
    expect(rive.Fit.cover).toBeDefined();
    expect(rive.Fit.none).not.toBe(rive.Fit.cover);
  };

  let callback2 : RuntimeCallback = (rive: typeof Rive) : void => 
    expect(rive).toBeDefined();

  let callback3 : RuntimeCallback = (rive: typeof Rive) : void => {
    expect(rive).toBeDefined();
    done();
  };

  utils.RuntimeLoader.getInstance(callback1);
  utils.RuntimeLoader.getInstance(callback2);
  // Delay 1 second to let library load
  setTimeout(() => utils.RuntimeLoader.getInstance(callback3), 1000);
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
  });
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