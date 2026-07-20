import { SemanticRole, SemanticState, SemanticTrait } from "../src/semantics/types";

/**
 * Shared fixture builders for semantics unit tests. All fields are optional
 * and default to neutral values so tests only need to specify what matters.
 */

export function node(
  id: number,
  opts: {
    parentId?: number;
    siblingIndex?: number;
    role?: number;
    label?: string;
    value?: string;
    hint?: string;
    stateFlags?: number;
    traitFlags?: number;
    headingLevel?: number;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
  } = {}
) {
  return {
    id,
    parentId: opts.parentId ?? -1,
    siblingIndex: opts.siblingIndex ?? 0,
    role: opts.role ?? SemanticRole.none,
    label: opts.label ?? "",
    value: opts.value ?? "",
    hint: opts.hint ?? "",
    stateFlags: opts.stateFlags ?? SemanticState.None,
    traitFlags: opts.traitFlags ?? SemanticTrait.None,
    headingLevel: opts.headingLevel ?? 0,
    minX: opts.minX ?? 0,
    minY: opts.minY ?? 0,
    maxX: opts.maxX ?? 100,
    maxY: opts.maxY ?? 100,
  };
}

export function children(parentId: number, childIds: number[]) {
  return { parentId, childIds };
}

export function bounds(id: number, minX: number, minY: number, maxX: number, maxY: number) {
  return { id, minX, minY, maxX, maxY };
}

export function diff(partial: {
  removed?: number[];
  added?: ReturnType<typeof node>[];
  moved?: ReturnType<typeof node>[];
  childrenUpdated?: ReturnType<typeof children>[];
  updatedSemantic?: ReturnType<typeof node>[];
  updatedGeometry?: ReturnType<typeof bounds>[];
} = {}): any {
  return {
    removed: [],
    added: [],
    moved: [],
    childrenUpdated: [],
    updatedSemantic: [],
    updatedGeometry: [],
    ...partial,
  };
}
