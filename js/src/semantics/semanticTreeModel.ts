import type {
  SemanticsDiff,
  SemanticsDiffNode,
  SemanticNodeData,
} from "./types";
import { roleName, stateNames, traitNames } from "./types";

/**
 * Maintains an in-memory semantic tree built from incremental
 * {@link SemanticsDiff} updates received each frame from the WASM runtime.
 *
 * Processing order within {@link applyDiff} follows the contract defined in
 * `semantic_snapshot.hpp`: removed → added → moved → childrenUpdated →
 * updatedSemantic → updatedGeometry.
 */
export class SemanticTreeModel {
  private _nodesById: Map<number, SemanticNodeData> = new Map();
  private _roots: number[] = [];
  private _semanticVersion = 0;
  private _geometryVersion = 0;
  private _geometryChangedIds: Set<number> = new Set();
  private _semanticChangedIds: Set<number> = new Set();

  get nodeCount(): number {
    return this._nodesById.size;
  }

  /** Bumped when semantic content or tree structure changes. */
  get semanticVersion(): number {
    return this._semanticVersion;
  }

  /** Bumped when node bounds change without a semantic/structural change. */
  get geometryVersion(): number {
    return this._geometryVersion;
  }

  /** Node IDs whose bounds changed in the most recent {@link applyDiff}. */
  get geometryChangedIds(): ReadonlySet<number> {
    return this._geometryChangedIds;
  }

  /**
   * Node IDs whose semantic fields (role/label/value/hint/flags/headingLevel)
   * changed in the most recent {@link applyDiff}. Structural changes (moves,
   * child reorders, removals) bump {@link semanticVersion} but don't mark
   * nodes here — element attributes don't depend on tree position.
   */
  get semanticChangedIds(): ReadonlySet<number> {
    return this._semanticChangedIds;
  }

  /** Root node IDs in sibling order. */
  get roots(): readonly number[] {
    return this._roots;
  }

  /** Look up a node by its ID, or undefined if not in the tree. */
  nodeById(id: number): SemanticNodeData | undefined {
    return this._nodesById.get(id);
  }

  /** Current index of a node among its siblings (or roots), or -1 if absent. */
  private siblingIndexOf(id: number): number {
    const node = this._nodesById.get(id);
    if (!node) return -1;
    if (node.parentId < 0) return this._roots.indexOf(id);
    const parent = this._nodesById.get(node.parentId);
    return parent ? parent.children.indexOf(id) : -1;
  }

  /** Detach a node from its current parent (or from roots). */
  private detach(id: number): void {
    const node = this._nodesById.get(id);
    if (!node) return;
    if (node.parentId < 0) {
      const idx = this._roots.indexOf(id);
      if (idx !== -1) this._roots.splice(idx, 1);
    } else {
      const parent = this._nodesById.get(node.parentId);
      if (parent) {
        const idx = parent.children.indexOf(id);
        if (idx !== -1) parent.children.splice(idx, 1);
      }
    }
  }

  /** Attach a node under a parent at a given sibling index (or as root). */
  private attach(id: number, parentId: number, siblingIndex: number): void {
    const node = this._nodesById.get(id);
    if (!node) return;
    if (parentId < 0) {
      node.parentId = -1;
      const idx = clamp(siblingIndex, 0, this._roots.length);
      this._roots.splice(idx, 0, id);
    } else {
      const parent = this._nodesById.get(parentId);
      if (!parent) {
        node.parentId = -1;
        this._roots.push(id);
      } else {
        node.parentId = parentId;
        const idx = clamp(siblingIndex, 0, parent.children.length);
        parent.children.splice(idx, 0, id);
      }
    }
  }

  /** Recursively remove a node and all descendants. */
  private removeSubtree(id: number): void {
    const node = this._nodesById.get(id);
    if (!node) return;
    // Copy children array — we're mutating during traversal
    const kids = [...node.children];
    for (const child of kids) {
      this.removeSubtree(child);
    }
    this.detach(id);
    this._nodesById.delete(id);
  }

  /**
   * Apply an incremental diff to the tree. Bumps version counters and notifies
   * listeners only when the tree actually changed.
   *
   * No-op diffs (field values identical to current model) do not bump
   * versions — the native side guards against emitting these, but applyDiff
   * defends its subscribers regardless.
   */
  applyDiff(diff: SemanticsDiff): void {
    this._geometryChangedIds.clear();
    this._semanticChangedIds.clear();
    let semanticChanged = false;
    let geometryChanged = false;

    const markSemantic = (): void => {
      semanticChanged = true;
    };
    const markSemanticNode = (id: number): void => {
      semanticChanged = true;
      this._semanticChangedIds.add(id);
    };
    const markGeometry = (id: number): void => {
      geometryChanged = true;
      this._geometryChangedIds.add(id);
    };

    // 1. removed
    for (const id of diff.removed) {
      if (this._nodesById.has(id)) {
        this.removeSubtree(id);
        markSemantic();
      }
    }

    // 2. added
    for (const n of diff.added) {
      const existing = this._nodesById.get(n.id);
      if (existing) {
        if (semanticFieldsDiffer(existing, n)) {
          applySemantic(existing, n);
          markSemanticNode(n.id);
        }
        if (geometryFieldsDiffer(existing, n)) {
          applyGeometry(existing, n);
          markGeometry(n.id);
        }
      } else {
        this._nodesById.set(n.id, nodeFromDiff(n));
        markSemanticNode(n.id);
        markGeometry(n.id);
      }
      this.detach(n.id);
      this.attach(n.id, n.parentId, n.siblingIndex);
    }

    // 3. moved
    // The runtime emits a node as "moved" when its parentId OR siblingIndex
    // changes, so a reorder-only move (same parent, new index) is still a
    // structural/semantic change. Compare the actual position before and after
    // re-attaching so that geometry-only or no-op moves don't bump the semantic
    // version (which would defeat the semantic/geometry version split).
    for (const n of diff.moved) {
      const existing = this._nodesById.get(n.id);
      if (!existing) continue;
      const parentChanged = existing.parentId !== n.parentId;
      const oldIndex = this.siblingIndexOf(n.id);
      const geomChanged = geometryFieldsDiffer(existing, n);
      if (geomChanged) {
        applyGeometry(existing, n);
        markGeometry(n.id);
      }
      this.detach(n.id);
      this.attach(n.id, n.parentId, n.siblingIndex);
      if (parentChanged || this.siblingIndexOf(n.id) !== oldIndex) {
        markSemantic();
      }
    }

    // 4. childrenUpdated
    for (const update of diff.childrenUpdated) {
      if (update.parentId < 0) {
        const next = update.childIds.filter((id) => this._nodesById.has(id));
        if (!arraysEqual(this._roots, next)) {
          this._roots.length = 0;
          this._roots.push(...next);
          for (const id of this._roots) {
            const node = this._nodesById.get(id);
            if (node) node.parentId = -1;
          }
          markSemantic();
        }
      } else {
        const parent = this._nodesById.get(update.parentId);
        if (!parent) continue;
        const next = update.childIds.filter((id) => this._nodesById.has(id));
        if (!arraysEqual(parent.children, next)) {
          parent.children.length = 0;
          parent.children.push(...next);
          for (const id of parent.children) {
            const node = this._nodesById.get(id);
            if (node) node.parentId = update.parentId;
          }
          markSemantic();
        }
      }
    }

    // 5. updatedSemantic — semantic fields updated
    for (const n of diff.updatedSemantic) {
      const existing = this._nodesById.get(n.id);
      if (!existing) continue;
      if (!semanticFieldsDiffer(existing, n)) continue;
      applySemantic(existing, n);
      markSemanticNode(n.id);
    }

    // 6. updatedGeometry — bounds of a semantic node updated
    for (const n of diff.updatedGeometry) {
      const existing = this._nodesById.get(n.id);
      if (!existing) continue;
      if (!geometryFieldsDiffer(existing, n)) continue;
      applyGeometry(existing, n);
      markGeometry(n.id);
    }

    if (!semanticChanged && !geometryChanged) return;
    if (semanticChanged) this._semanticVersion++;
    if (geometryChanged) this._geometryVersion++;
    if (this._debug) {
      this.logDiff(diff, semanticChanged, geometryChanged);
    }
  }

  private _debug = false;

  /** Enable/disable debug logging of diffs to the console. */
  set debug(enabled: boolean) {
    this._debug = enabled;
  }

  private logDiff(
    diff: SemanticsDiff,
    semanticChanged: boolean,
    geometryChanged: boolean,
  ): void {
    const lines: string[] = [
      `[rive:semantics] semantic v${this._semanticVersion}` +
        (geometryChanged ? ` geometry v${this._geometryVersion}` : "") +
        (semanticChanged ? "" : " (geometry-only)"),
    ];
    for (const id of diff.removed) {
      lines.push(`  - removed #${id}`);
    }
    for (const n of diff.added) {
      lines.push(
        `  + added #${n.id} ${roleName(n.role)}` +
          (n.label ? ` "${n.label}"` : "") +
          ` bounds:(${n.minX.toFixed(1)},${n.minY.toFixed(1)})-(${n.maxX.toFixed(1)},${n.maxY.toFixed(1)})` +
          ` states=[${stateNames(n.stateFlags)}]` +
          ` traits=[${traitNames(n.traitFlags)}]`
      );
    }
    for (const n of diff.moved) {
      lines.push(
        `  ~ moved #${n.id} → parent=${n.parentId} idx=${n.siblingIndex}` +
          ` bounds:(${n.minX.toFixed(1)},${n.minY.toFixed(1)})-(${n.maxX.toFixed(1)},${n.maxY.toFixed(1)})`
      );
    }
    for (const u of diff.childrenUpdated) {
      lines.push(
        `  ↕ children of ${
          u.parentId < 0 ? "root" : "#" + u.parentId
        }: [${u.childIds.join(", ")}]`
      );
    }
    for (const n of diff.updatedSemantic) {
      lines.push(
        `  ✎ semantic #${n.id} ${roleName(n.role)}` +
          (n.label ? ` "${n.label}"` : "") +
          ` states=[${stateNames(n.stateFlags)}]` +
          ` traits=[${traitNames(n.traitFlags)}]`
      );
    }
    for (const n of diff.updatedGeometry) {
      lines.push(
        `  ⊞ geometry #${n.id} (${n.minX.toFixed(1)},${n.minY.toFixed(1)})-(${n.maxX.toFixed(1)},${n.maxY.toFixed(1)})`
      );
    }
    console.log(lines.join("\n"));
  }

  /**
   * Returns every node in depth-first order, paired with its depth level.
   * Useful for debug logging / rendering a flat list.
   */
  flattened(): Array<{ depth: number; node: SemanticNodeData }> {
    const out: Array<{ depth: number; node: SemanticNodeData }> = [];
    const walk = (id: number, depth: number) => {
      const node = this._nodesById.get(id);
      if (!node) return;
      out.push({ depth, node });
      for (const child of node.children) {
        walk(child, depth + 1);
      }
    };
    for (const root of this._roots) {
      walk(root, 0);
    }
    return out;
  }
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function nodeFromDiff(n: SemanticsDiffNode): SemanticNodeData {
  return {
    id: n.id,
    parentId: -1,
    role: n.role,
    label: n.label,
    value: n.value,
    hint: n.hint,
    stateFlags: n.stateFlags,
    traitFlags: n.traitFlags,
    headingLevel: n.headingLevel,
    minX: n.minX,
    minY: n.minY,
    maxX: n.maxX,
    maxY: n.maxY,
    children: [],
  };
}

/** Compare role/label/value/hint/stateFlags/traitFlags/headingLevel. */
function semanticFieldsDiffer(
  a: SemanticNodeData,
  b: SemanticsDiffNode
): boolean {
  return (
    a.role !== b.role ||
    a.label !== b.label ||
    a.value !== b.value ||
    a.hint !== b.hint ||
    a.stateFlags !== b.stateFlags ||
    a.traitFlags !== b.traitFlags ||
    a.headingLevel !== b.headingLevel
  );
}

/** Compare only bounds (minX/minY/maxX/maxY). */
function geometryFieldsDiffer(
  a: SemanticNodeData,
  b: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
  return (
    a.minX !== b.minX ||
    a.minY !== b.minY ||
    a.maxX !== b.maxX ||
    a.maxY !== b.maxY
  );
}

function applySemantic(target: SemanticNodeData, src: SemanticsDiffNode): void {
  target.role = src.role;
  target.label = src.label;
  target.value = src.value;
  target.hint = src.hint;
  target.stateFlags = src.stateFlags;
  target.traitFlags = src.traitFlags;
  target.headingLevel = src.headingLevel;
}

function applyGeometry(
  target: SemanticNodeData,
  src: { minX: number; minY: number; maxX: number; maxY: number }
): void {
  target.minX = src.minX;
  target.minY = src.minY;
  target.maxX = src.maxX;
  target.maxY = src.maxY;
}
