import {
  GAMEPAD_BATCH_VERSION,
  GAMEPAD_MAX_AXES,
  GAMEPAD_MAX_BUTTONS,
  GamepadBatchEncoder,
  GamepadChangeKind,
  GamepadMappingKind,
  GamepadRecordType,
} from "../src/utils/gamepadBatchEncoder";

function viewOf(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

describe("GamepadBatchEncoder", () => {
  test("begin writes only the version header", () => {
    const encoder = new GamepadBatchEncoder();
    encoder.begin();
    const bytes = encoder.end();
    expect(encoder.isEmpty).toBe(true);
    expect(bytes.length).toBe(4);
    expect(viewOf(bytes).getUint32(0, true)).toBe(GAMEPAD_BATCH_VERSION);
  });

  test("encodes a connected record", () => {
    const encoder = new GamepadBatchEncoder();
    encoder.begin();
    encoder.connected(7, GamepadMappingKind.Standard, [0, 1], [0.5, -1, 0.25]);
    const bytes = encoder.end();
    const view = viewOf(bytes);
    expect(encoder.isEmpty).toBe(false);
    expect(bytes.length).toBe(4 + 9 + 5 * 4);
    expect(view.getUint8(4)).toBe(GamepadRecordType.Connected);
    expect(view.getInt32(5, true)).toBe(7);
    expect(view.getUint8(9)).toBe(GamepadMappingKind.Standard);
    expect(view.getUint8(10)).toBe(2);
    expect(view.getUint8(11)).toBe(3);
    expect(view.getUint8(12)).toBe(0);
    expect(view.getFloat32(13, true)).toBe(0);
    expect(view.getFloat32(17, true)).toBe(1);
    expect(view.getFloat32(21, true)).toBe(0.5);
    expect(view.getFloat32(25, true)).toBe(-1);
    expect(view.getFloat32(29, true)).toBe(0.25);
  });

  test("encodes an update record with a single change", () => {
    const encoder = new GamepadBatchEncoder();
    encoder.begin();
    encoder.update(3, GamepadChangeKind.Axis, 5, 0.75);
    const bytes = encoder.end();
    const view = viewOf(bytes);
    expect(bytes.length).toBe(4 + 12);
    expect(view.getUint8(4)).toBe(GamepadRecordType.Update);
    expect(view.getInt32(5, true)).toBe(3);
    expect(view.getUint8(9)).toBe(1);
    expect(view.getUint8(10)).toBe(GamepadChangeKind.Axis);
    expect(view.getUint8(11)).toBe(5);
    expect(view.getFloat32(12, true)).toBe(0.75);
  });

  test("encodes a disconnected record", () => {
    const encoder = new GamepadBatchEncoder();
    encoder.begin();
    encoder.disconnected(-2);
    const bytes = encoder.end();
    const view = viewOf(bytes);
    expect(bytes.length).toBe(4 + 5);
    expect(view.getUint8(4)).toBe(GamepadRecordType.Disconnected);
    expect(view.getInt32(5, true)).toBe(-2);
  });

  test("clamps button and axis counts to the wire caps", () => {
    const encoder = new GamepadBatchEncoder();
    encoder.begin();
    encoder.connected(
      1,
      GamepadMappingKind.Standard,
      new Array(GAMEPAD_MAX_BUTTONS + 4).fill(0),
      new Array(GAMEPAD_MAX_AXES + 4).fill(0),
    );
    const bytes = encoder.end();
    const view = viewOf(bytes);
    expect(view.getUint8(10)).toBe(GAMEPAD_MAX_BUTTONS);
    expect(view.getUint8(11)).toBe(GAMEPAD_MAX_AXES);
    expect(bytes.length).toBe(
      4 + 9 + (GAMEPAD_MAX_BUTTONS + GAMEPAD_MAX_AXES) * 4,
    );
  });

  test("grows past its initial capacity and keeps earlier records", () => {
    const encoder = new GamepadBatchEncoder(8);
    encoder.begin();
    for (let i = 0; i < 20; i++) {
      encoder.update(1, GamepadChangeKind.Button, i, i / 20);
    }
    const bytes = encoder.end();
    const view = viewOf(bytes);
    expect(bytes.length).toBe(4 + 20 * 12);
    expect(view.getUint32(0, true)).toBe(GAMEPAD_BATCH_VERSION);
    for (let i = 0; i < 20; i++) {
      const offset = 4 + i * 12;
      expect(view.getUint8(offset + 7)).toBe(i);
      expect(view.getFloat32(offset + 8, true)).toBeCloseTo(i / 20);
    }
  });

  test("begin resets the buffer for the next batch", () => {
    const encoder = new GamepadBatchEncoder();
    encoder.begin();
    encoder.disconnected(1);
    encoder.end();
    encoder.begin();
    expect(encoder.isEmpty).toBe(true);
    expect(encoder.end().length).toBe(4);
  });
});
