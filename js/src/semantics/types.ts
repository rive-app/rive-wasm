import type {
  SemanticsDiffNode,
  SemanticsDiff,
} from "../rive_advanced.mjs";

export type {
  SemanticsDiffNode,
  SemanticsDiff,
};

// ---------------------------------------------------------------------------
// SemanticRole — mirrors rive::SemanticRole
// ---------------------------------------------------------------------------
export const SemanticRole = {
  none: 0,
  button: 1,
  link: 2,
  checkbox: 3,
  switchControl: 4,
  slider: 5,
  textField: 6,
  text: 7,
  image: 8,
  group: 9,
  list: 10,
  listItem: 11,
  tab: 12,
  tabList: 13,
  dialog: 14,
  alertDialog: 15,
  radioGroup: 16,
  radioButton: 17,
} as const;

export type SemanticRole = (typeof SemanticRole)[keyof typeof SemanticRole];

// ---------------------------------------------------------------------------
// SemanticState — mirrors rive::SemanticState bitmask
//
// Bits 0-7 are trait-gated (only meaningful when the corresponding
// SemanticTrait is set). Bits 8-13 are non-trait states.
//
// Check state is the exception: it is a two-bit *field* at bits 2-3 rather
// than a flag, because a checkbox is tri-state. It is not a member of this
// table — read it with checkStateOf().
// ---------------------------------------------------------------------------
export const SemanticState = {
  None: 0,

  // Trait-gated
  Expanded: 1 << 0, // requires Expandable
  Selected: 1 << 1, // requires Selectable
  // Bits 2-3 are the check state field, not independent flags -- see SemanticCheckState.
  Toggled: 1 << 4, // requires Toggleable
  Required: 1 << 5, // requires Requirable
  Disabled: 1 << 6, // requires Enablable
  Focused: 1 << 7, // requires Focusable

  // Non-trait
  Hidden: 1 << 8,
  LiveRegion: 1 << 9,
  ReadOnly: 1 << 10,
  Modal: 1 << 11,
  Obscured: 1 << 12,
  Multiline: 1 << 13,
} as const;

export function hasState(flags: number, state: number): boolean {
  return (flags & state) !== 0;
}

// SemanticCheckState — mirrors rive::SemanticCheckState
//
// The tri-state of a checkable node. Occupies two bits of stateFlags at
// CHECK_STATE_OFFSET, so it is read as a value rather than tested as a flag.
// Only meaningful when the Checkable trait is set.
export const SemanticCheckState = {
  Unchecked: 0,
  Checked: 1,
  Mixed: 2,
} as const;

export type SemanticCheckState =
  (typeof SemanticCheckState)[keyof typeof SemanticCheckState];

/** Bit offset of the check field within stateFlags. */
export const CHECK_STATE_OFFSET = 2;

/** Mask of the check field within stateFlags. */
export const CHECK_STATE_MASK = 0b11 << CHECK_STATE_OFFSET;

/**
 * Decodes the check field out of `flags`. The field is two bits. Returns 0, 1, or 2
 * per the mapping in SemanticCheckState.
 */
export function checkStateOf(flags: number): SemanticCheckState {
  const value = (flags & CHECK_STATE_MASK) >> CHECK_STATE_OFFSET;
  return value >= SemanticCheckState.Mixed
    ? SemanticCheckState.Mixed
    : (value as SemanticCheckState);
}

/**
 * Controls when the instance builds semantic trees and accessibility overlays.
 *
 * - `disabled`: no semantics work.
 * - `enabled`: semantics and overlay are active immediately after load.
 */
export const SemanticMode = {
  Disabled: "disabled",
  Enabled: "enabled",
} as const;

export type SemanticMode = (typeof SemanticMode)[keyof typeof SemanticMode];

export interface RiveSemanticsOptions {
  /**
   * aria-label for the semantic DOM container element
   */
  riveCanvasLabel?: string;
}

// ---------------------------------------------------------------------------
// SemanticTrait — mirrors rive::SemanticTrait bitmask
//
// Traits declare what *capabilities* a node has. A state flag is only
// meaningful when its corresponding trait is set.
// ---------------------------------------------------------------------------
export const SemanticTrait = {
  None: 0,
  Expandable: 1 << 0,
  Selectable: 1 << 1,
  Checkable: 1 << 2,
  Toggleable: 1 << 3,
  Requirable: 1 << 4,
  Enablable: 1 << 5,
  Focusable: 1 << 6,
} as const;

export function hasTrait(flags: number, trait: number): boolean {
  return (flags & trait) !== 0;
}

// ---------------------------------------------------------------------------
// SemanticActionType — mirrors rive::SemanticActionType
// ---------------------------------------------------------------------------
export const SemanticActionType = {
  tap: 0,
  increase: 1,
  decrease: 2,
} as const;

export type SemanticActionType =
  (typeof SemanticActionType)[keyof typeof SemanticActionType];

// ---------------------------------------------------------------------------
// SemanticNodeData — in-memory representation of a single node in the tree
// ---------------------------------------------------------------------------
export interface SemanticNodeData {
  readonly id: number;
  parentId: number;
  role: number;
  label: string;
  value: string;
  hint: string;
  stateFlags: number;
  traitFlags: number;
  headingLevel: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  children: number[];
}

// ---------------------------------------------------------------------------
// Helpers — readable names for bitmask flags
// ---------------------------------------------------------------------------

const _roleNames: Record<number, string> = {};
for (const [name, val] of Object.entries(SemanticRole)) {
  _roleNames[val as number] = name;
}

const _stateEntries = Object.entries(SemanticState).filter(
  ([, v]) => v !== 0
) as [string, number][];

const _traitEntries = Object.entries(SemanticTrait).filter(
  ([, v]) => v !== 0
) as [string, number][];

export function roleName(role: number): string {
  return _roleNames[role] ?? `unknown(${role})`;
}

export function stateNames(flags: number): string {
  if (flags === 0) return "none";
  const active: string[] = [];
  for (const [name, bit] of _stateEntries) {
    if (flags & bit) active.push(name);
  }
  switch (checkStateOf(flags)) {
    case SemanticCheckState.Checked:
      active.push("Checked");
      break;
    case SemanticCheckState.Mixed:
      active.push("Mixed");
      break;
  }
  return active.join(", ") || "none";
}

export function traitNames(flags: number): string {
  if (flags === 0) return "none";
  const active: string[] = [];
  for (const [name, bit] of _traitEntries) {
    if (flags & bit) active.push(name);
  }
  return active.join(", ") || "none";
}
