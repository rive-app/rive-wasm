const utils = require('./utils');
const Rive = require('../../wasm/publish/rive.js')

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
  // console.log(rive);
  expect(layout).toBeDefined();
  // expect(layout.runtimeFit(rive)).toBe(utils.Fit.None);
  // expect(layout.runtimeAlignment()).toBe(utils.Alignment.Center);
});

// #endregion