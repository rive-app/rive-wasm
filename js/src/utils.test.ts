const utils = require('./utils');


test('Creating loop event accepts valid loop values', () : void => {
  const event = utils.createLoopEvent('name', 0);
  expect(event.loopType).toBe(0);
  expect(event.loopName).toBe('oneShot');
  expect(event.animation).toBe('name');
});

test('Creating loop event throws on invalid loop values', () : void => {
    expect(() => {
      utils.createLoopEvent('name', 4);
    }).toThrow('Invalid loop value');
});