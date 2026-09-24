import { Key, keyboardEventToRiveKey } from "../src/utils/keyMap";

const riveKey = (code: string, key: string, init: KeyboardEventInit = {}) =>
  keyboardEventToRiveKey(new KeyboardEvent("keydown", { code, key, ...init }));

// Each case is a real (code, key) pair a browser reports, and the key the editor
// would dispatch for it.
test.each([
  ["US letter", "KeyA", "a", {}, Key.a],
  ["Shift doesn't change the letter", "KeyA", "A", { shiftKey: true }, Key.a],
  ["AZERTY: the key labelled A sits at KeyQ", "KeyQ", "a", {}, Key.a],
  ["Dvorak: the key labelled O sits at KeyS", "KeyS", "o", {}, Key.o],
  ["non-Latin letter falls back to position", "KeyA", "ф", {}, Key.a],
  ["macOS Option character falls back to position", "KeyA", "å", { altKey: true }, Key.a],
  ["Cmd chord keeps the letter", "KeyZ", "z", { metaKey: true }, Key.z],
  ["digit", "Digit1", "1", {}, Key.key1],
  // AZERTY's digit row types punctuation unshifted ("'" on 4, "-" on 6), which on its
  // own would map to Key.apostrophe / Key.minus.
  ["AZERTY digit row (\"'\" on 4) is still the digit", "Digit4", "'", {}, Key.key4],
  ["AZERTY digit row (\"-\" on 6) is still the digit", "Digit6", "-", {}, Key.key6],
  ["unshifted punctuation", "Comma", ",", {}, Key.comma],
  ["shifted punctuation falls back to position", "Comma", "<", { shiftKey: true }, Key.comma],
  ["AZERTY comma sits at KeyM", "KeyM", ",", {}, Key.comma],
  ["dead key falls back to position", "BracketLeft", "Dead", {}, Key.leftBracket],
  ["space", "Space", " ", {}, Key.space],
  ["arrow", "ArrowLeft", "ArrowLeft", {}, Key.left],
  ["numpad arrow with NumLock off", "Numpad4", "ArrowLeft", {}, Key.left],
  ["numpad digit with NumLock on", "Numpad4", "4", {}, Key.kp4],
  ["numpad Enter stays distinct", "NumpadEnter", "Enter", {}, Key.kpEnter],
  ["OS-remapped key follows what it produces", "CapsLock", "Escape", {}, Key.escape],
  ["function key", "F5", "F5", {}, Key.f5],
  ["last function key", "F25", "F25", {}, Key.f25],
  // Modifier keys are dispatched as keys too, as the editor does.
  ["modifier key itself", "ControlLeft", "Control", { ctrlKey: true }, Key.leftControl],
  ["Windows AltGr", "AltRight", "AltGraph", {}, Key.rightAlt],
  ["macOS Cmd", "MetaLeft", "Meta", { metaKey: true }, Key.leftSuper],
] as const)("%s", (_label, code, key, init, expected) => {
  expect(riveKey(code, key, init)).toBe(expected);
});

test.each([
  ["unmapped key", "AudioVolumeUp", "AudioVolumeUp"],
  ["unidentified key with no code", "", "Unidentified"],
])("%s is not dispatched", (_label, code, key) => {
  expect(riveKey(code, key)).toBeNull();
});
