/*
 * Maps DOM keyboard events to the GLFW-style key codes and modifier bitmask
 * that StateMachineInstance.keyInput() expects. Values mirror `enum class Key`
 * and `enum class KeyModifiers` in rive-runtime focusable.hpp;
 * they are stable GLFW codes, so they live here as constants instead of an
 * embind enum.
 */

export const Key = {
  space: 32,
  apostrophe: 39, // '
  comma: 44, // ,
  minus: 45, // -
  period: 46, // .
  slash: 47, // /
  key0: 48,
  key1: 49,
  key2: 50,
  key3: 51,
  key4: 52,
  key5: 53,
  key6: 54,
  key7: 55,
  key8: 56,
  key9: 57,
  semicolon: 59, // ;
  equal: 61, // =
  a: 65,
  b: 66,
  c: 67,
  d: 68,
  e: 69,
  f: 70,
  g: 71,
  h: 72,
  i: 73,
  j: 74,
  k: 75,
  l: 76,
  m: 77,
  n: 78,
  o: 79,
  p: 80,
  q: 81,
  r: 82,
  s: 83,
  t: 84,
  u: 85,
  v: 86,
  w: 87,
  x: 88,
  y: 89,
  z: 90,
  leftBracket: 91, // [
  backslash: 92, // \
  rightBracket: 93, // ]
  graveAccent: 96, // `
  world1: 161, // non-US #1
  world2: 162, // non-US #2
  escape: 256,
  enter: 257,
  tab: 258,
  backspace: 259,
  insert: 260,
  deleteKey: 261,
  right: 262,
  left: 263,
  down: 264,
  up: 265,
  pageUp: 266,
  pageDown: 267,
  home: 268,
  end: 269,
  capsLock: 280,
  scrollLock: 281,
  numLock: 282,
  printScreen: 283,
  pause: 284,
  f1: 290,
  f2: 291,
  f3: 292,
  f4: 293,
  f5: 294,
  f6: 295,
  f7: 296,
  f8: 297,
  f9: 298,
  f10: 299,
  f11: 300,
  f12: 301,
  f13: 302,
  f14: 303,
  f15: 304,
  f16: 305,
  f17: 306,
  f18: 307,
  f19: 308,
  f20: 309,
  f21: 310,
  f22: 311,
  f23: 312,
  f24: 313,
  f25: 314,
  kp0: 320,
  kp1: 321,
  kp2: 322,
  kp3: 323,
  kp4: 324,
  kp5: 325,
  kp6: 326,
  kp7: 327,
  kp8: 328,
  kp9: 329,
  kpDecimal: 330,
  kpDivide: 331,
  kpMultiply: 332,
  kpSubtract: 333,
  kpAdd: 334,
  kpEnter: 335,
  kpEqual: 336,
  leftShift: 340,
  leftControl: 341,
  leftAlt: 342,
  leftSuper: 343,
  rightShift: 344,
  rightControl: 345,
  rightAlt: 346,
  rightSuper: 347,
  menu: 348,
} as const;

export const KeyModifiers = {
  none: 0,
  shift: 1 << 0,
  ctrl: 1 << 1,
  alt: 1 << 2,
  meta: 1 << 3,
} as const;

// Physical key (KeyboardEvent.code) to Rive key, by US-QWERTY position.
const CODE_TO_KEY: Readonly<Record<string, number>> = {
  // Modifiers are keys too (the editor sends them), and are also in the bitmask.
  ShiftLeft: Key.leftShift,
  ShiftRight: Key.rightShift,
  ControlLeft: Key.leftControl,
  ControlRight: Key.rightControl,
  AltLeft: Key.leftAlt,
  AltRight: Key.rightAlt,
  MetaLeft: Key.leftSuper,
  MetaRight: Key.rightSuper,

  KeyA: Key.a,
  KeyB: Key.b,
  KeyC: Key.c,
  KeyD: Key.d,
  KeyE: Key.e,
  KeyF: Key.f,
  KeyG: Key.g,
  KeyH: Key.h,
  KeyI: Key.i,
  KeyJ: Key.j,
  KeyK: Key.k,
  KeyL: Key.l,
  KeyM: Key.m,
  KeyN: Key.n,
  KeyO: Key.o,
  KeyP: Key.p,
  KeyQ: Key.q,
  KeyR: Key.r,
  KeyS: Key.s,
  KeyT: Key.t,
  KeyU: Key.u,
  KeyV: Key.v,
  KeyW: Key.w,
  KeyX: Key.x,
  KeyY: Key.y,
  KeyZ: Key.z,

  Digit0: Key.key0,
  Digit1: Key.key1,
  Digit2: Key.key2,
  Digit3: Key.key3,
  Digit4: Key.key4,
  Digit5: Key.key5,
  Digit6: Key.key6,
  Digit7: Key.key7,
  Digit8: Key.key8,
  Digit9: Key.key9,

  Numpad0: Key.kp0,
  Numpad1: Key.kp1,
  Numpad2: Key.kp2,
  Numpad3: Key.kp3,
  Numpad4: Key.kp4,
  Numpad5: Key.kp5,
  Numpad6: Key.kp6,
  Numpad7: Key.kp7,
  Numpad8: Key.kp8,
  Numpad9: Key.kp9,
  NumpadDecimal: Key.kpDecimal,
  NumpadDivide: Key.kpDivide,
  NumpadMultiply: Key.kpMultiply,
  NumpadSubtract: Key.kpSubtract,
  NumpadAdd: Key.kpAdd,
  NumpadEnter: Key.kpEnter,
  NumpadEqual: Key.kpEqual,

  Minus: Key.minus,
  Equal: Key.equal,
  BracketLeft: Key.leftBracket,
  BracketRight: Key.rightBracket,
  Backslash: Key.backslash,
  Semicolon: Key.semicolon,
  Quote: Key.apostrophe,
  Backquote: Key.graveAccent,
  Comma: Key.comma,
  Period: Key.period,
  Slash: Key.slash,
  IntlBackslash: Key.world1,
  IntlRo: Key.world2,

  Space: Key.space,
  Enter: Key.enter,
  Tab: Key.tab,
  Backspace: Key.backspace,
  Insert: Key.insert,
  Delete: Key.deleteKey,
  Escape: Key.escape,
  ArrowRight: Key.right,
  ArrowLeft: Key.left,
  ArrowDown: Key.down,
  ArrowUp: Key.up,
  PageUp: Key.pageUp,
  PageDown: Key.pageDown,
  Home: Key.home,
  End: Key.end,

  CapsLock: Key.capsLock,
  ScrollLock: Key.scrollLock,
  NumLock: Key.numLock,
  PrintScreen: Key.printScreen,
  Pause: Key.pause,
  ContextMenu: Key.menu,

  F1: Key.f1,
  F2: Key.f2,
  F3: Key.f3,
  F4: Key.f4,
  F5: Key.f5,
  F6: Key.f6,
  F7: Key.f7,
  F8: Key.f8,
  F9: Key.f9,
  F10: Key.f10,
  F11: Key.f11,
  F12: Key.f12,
  F13: Key.f13,
  F14: Key.f14,
  F15: Key.f15,
  F16: Key.f16,
  F17: Key.f17,
  F18: Key.f18,
  F19: Key.f19,
  F20: Key.f20,
  F21: Key.f21,
  F22: Key.f22,
  F23: Key.f23,
  F24: Key.f24,
  F25: Key.f25,
};

// Unshifted characters (event.key, lowercased) that name a Rive key.
const CHAR_TO_KEY: Readonly<Record<string, number>> = (() => {
  const map: Record<string, number> = {
    " ": Key.space,
    "'": Key.apostrophe,
    ",": Key.comma,
    "-": Key.minus,
    ".": Key.period,
    "/": Key.slash,
    ";": Key.semicolon,
    "=": Key.equal,
    "[": Key.leftBracket,
    "\\": Key.backslash,
    "]": Key.rightBracket,
    "`": Key.graveAccent,
  };
  for (let c = 0; c < 26; c++) map[String.fromCharCode(97 + c)] = Key.a + c;
  for (let d = 0; d <= 9; d++) map[String(d)] = Key.key0 + d;
  return map;
})();

// Non-printable event.key values; each shares its name with its code.
const NAMED_KEYS = new Set<string>([
  "Enter",
  "Tab",
  "Backspace",
  "Insert",
  "Delete",
  "Escape",
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "CapsLock",
  "ScrollLock",
  "NumLock",
  "PrintScreen",
  "Pause",
  "ContextMenu",
  ...Array.from({ length: 25 }, (_, i) => `F${i + 1}`),
]);

/**
 * Maps a KeyboardEvent to a Rive key, or null if Rive has no equivalent.
 *
 * Resolves the logical key: what the user's layout labels the key, ignoring
 * Shift, so a listener on "A" fires on AZERTY's A too. `event.key` is preferred;
 * `event.code` is the fallback when `key` isn't a plain unshifted character
 * (shifted symbols, Option/AltGr output, non-Latin letters, dead keys).
 * Digit-row and numpad keys skip the character lookup so AZERTY's digit row
 * still reports digits and numpad digits stay distinct from the digit row.
 */
export function keyboardEventToRiveKey(event: KeyboardEvent): number | null {
  const { code, key } = event;
  if (NAMED_KEYS.has(key)) {
    // NumpadEnter reports key "Enter"; keep it distinct.
    return code === "NumpadEnter" ? Key.kpEnter : CODE_TO_KEY[key] ?? null;
  }
  if (!code.startsWith("Digit") && !code.startsWith("Numpad") && key) {
    const fromChar = CHAR_TO_KEY[key.toLowerCase()];
    if (fromChar !== undefined) return fromChar;
  }
  return CODE_TO_KEY[code] ?? null;
}

export function modifiersFromEvent(event: KeyboardEvent): number {
  let modifiers = KeyModifiers.none;
  if (event.shiftKey) modifiers |= KeyModifiers.shift;
  if (event.ctrlKey) modifiers |= KeyModifiers.ctrl;
  if (event.altKey) modifiers |= KeyModifiers.alt;
  if (event.metaKey) modifiers |= KeyModifiers.meta;
  return modifiers;
}
