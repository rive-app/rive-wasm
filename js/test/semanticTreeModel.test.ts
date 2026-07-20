import { SemanticTreeModel } from "../src/semantics/semanticTreeModel";
import { SemanticRole, SemanticState, SemanticTrait } from "../src/semantics/types";
import { node, children, bounds, diff } from "./semanticsFixtures";

// Test the internal model for representing the Rive semantic tree in memory
describe("SemanticTreeModel", () => {
  let model: SemanticTreeModel;

  beforeEach(() => {
    model = new SemanticTreeModel();
  });

  // ---- initial state ----

  describe("initial state", () => {
    test("starts empty with version 0", () => {
      expect(model.nodeCount).toBe(0);
      expect(model.roots).toEqual([]);
      expect(model.semanticVersion).toBe(0);
    });
  });

  // ---- Adding nodes to the tree representation ----

  describe("applyDiff: added", () => {
    test("creates a root node when parentId is -1", () => {
      model.applyDiff(diff({
        added: [node(1, { role: SemanticRole.button, label: "OK" })],
      }));
      expect(model.nodeCount).toBe(1);
      expect(model.roots).toEqual([1]);
      const n = model.nodeById(1)!;
      expect(n.role).toBe(SemanticRole.button);
      expect(n.label).toBe("OK");
      expect(n.parentId).toBe(-1);
    });

    test("attaches a child to an existing parent", () => {
      model.applyDiff(diff({ added: [node(1)] }));
      model.applyDiff(diff({ added: [node(2, { parentId: 1, siblingIndex: 0 })] }));

      expect(model.nodeById(1)!.children).toEqual([2]);
      expect(model.nodeById(2)!.parentId).toBe(1);
      expect(model.roots).toEqual([1]);
    });

    test("falls back to root when the named parent does not exist", () => {
      model.applyDiff(diff({ added: [node(5, { parentId: 999 })] }));
      expect(model.roots).toContain(5);
      expect(model.nodeById(5)!.parentId).toBe(-1);
    });

    test("inserts multiple siblings in siblingIndex order", () => {
      model.applyDiff(diff({ added: [node(1)] }));
      model.applyDiff(diff({
        added: [
          node(2, { parentId: 1, siblingIndex: 0 }),
          node(3, { parentId: 1, siblingIndex: 1 }),
          node(4, { parentId: 1, siblingIndex: 2 }),
        ],
      }));
      expect(model.nodeById(1)!.children).toEqual([2, 3, 4]);
    });

    test("updates fields in-place when the node already exists", () => {
      model.applyDiff(diff({ added: [node(1, { role: SemanticRole.text, label: "old" })] }));
      model.applyDiff(diff({ added: [node(1, { role: SemanticRole.button, label: "new" })] }));
      expect(model.nodeCount).toBe(1);
      const n = model.nodeById(1)!;
      expect(n.role).toBe(SemanticRole.button);
      expect(n.label).toBe("new");
    });

    test("does not bump version when re-adding an existing node with identical fields", () => {
      model.applyDiff(diff({ added: [node(1, { role: SemanticRole.button, label: "OK" })] }));
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({ added: [node(1, { role: SemanticRole.button, label: "OK" })] }));
      expect(model.semanticVersion).toBe(vBefore);
    });
  });

  // ---- Removing nodes from the tree representation ----

  describe("applyDiff: removed", () => {
    test("removes a leaf node from the tree", () => {
      model.applyDiff(diff({ added: [node(1)] }));
      model.applyDiff(diff({ removed: [1] }));
      expect(model.nodeCount).toBe(0);
      expect(model.roots).toEqual([]);
    });

    test("recursively removes an entire subtree", () => {
      model.applyDiff(diff({
        added: [node(1), node(2, { parentId: 1 }), node(3, { parentId: 2 })],
        childrenUpdated: [
          children(-1, [1]),
          children(1, [2]),
          children(2, [3]),
        ],
      }));
      model.applyDiff(diff({ removed: [1] }));
      expect(model.nodeCount).toBe(0);
      expect(model.nodeById(2)).toBeUndefined();
      expect(model.nodeById(3)).toBeUndefined();
    });

    test("detaches the removed node from its parent's children list", () => {
      model.applyDiff(diff({
        added: [node(1), node(2, { parentId: 1 })],
        childrenUpdated: [children(1, [2])],
      }));
      model.applyDiff(diff({ removed: [2] }));
      expect(model.nodeById(1)!.children).not.toContain(2);
    });

    test("is a no-op for a non-existent ID", () => {
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({ removed: [999] }));
      expect(model.semanticVersion).toBe(vBefore);
    });
  });

  // ---- Moving nodes within the tree ----

  describe("applyDiff: moved", () => {
    test("relocates a node to a different parent", () => {
      model.applyDiff(diff({
        added: [node(1), node(2), node(3, { parentId: 1 })],
        childrenUpdated: [children(1, [3])],
      }));
      model.applyDiff(diff({
        moved: [node(3, { parentId: 2, siblingIndex: 0 })],
      }));

      expect(model.nodeById(1)!.children).not.toContain(3);
      expect(model.nodeById(2)!.children).toContain(3);
      expect(model.nodeById(3)!.parentId).toBe(2);
    });

    test("updates geometry when the moved node carries new bounds", () => {
      model.applyDiff(diff({ added: [node(1, { minX: 0, maxX: 50 })] }));
      const semanticBefore = model.semanticVersion;
      const geometryBefore = model.geometryVersion;
      model.applyDiff(diff({
        moved: [node(1, { parentId: -1, siblingIndex: 0, minX: 10, maxX: 60 })],
      }));
      expect(model.nodeById(1)!.minX).toBe(10);
      expect(model.nodeById(1)!.maxX).toBe(60);
      expect(model.semanticVersion).toBe(semanticBefore);
      expect(model.geometryVersion).toBe(geometryBefore + 1);
      expect(model.geometryChangedIds).toEqual(new Set([1]));
    });

    test("skips a non-existent node without bumping version", () => {
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({ moved: [node(999, { parentId: -1 })] }));
      expect(model.semanticVersion).toBe(vBefore);
    });

    test("reorder-only move (same parent, new siblingIndex) bumps semanticVersion", () => {
      model.applyDiff(diff({
        added: [node(1), node(2, { parentId: 1 }), node(3, { parentId: 1 })],
        childrenUpdated: [children(1, [2, 3])],
      }));
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({
        moved: [node(3, { parentId: 1, siblingIndex: 0 })],
      }));
      expect(model.nodeById(1)!.children).toEqual([3, 2]);
      expect(model.semanticVersion).toBe(vBefore + 1);
    });

    test("does not bump version when parent and geometry are unchanged", () => {
      model.applyDiff(diff({ added: [node(1, { parentId: -1, siblingIndex: 0, minX: 0, maxX: 50 })] }));
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({
        moved: [node(1, { parentId: -1, siblingIndex: 0, minX: 0, maxX: 50 })],
      }));
      expect(model.semanticVersion).toBe(vBefore);
    });
  });

  // ---- Update children of a node (reordering, adding, removing, etc.) ----

  describe("applyDiff: childrenUpdated", () => {
    test("reorders root nodes", () => {
      model.applyDiff(diff({
        added: [node(1), node(2), node(3)],
        childrenUpdated: [children(-1, [1, 2, 3])],
      }));
      expect(model.roots).toEqual([1, 2, 3]);
      model.applyDiff(diff({
        childrenUpdated: [children(-1, [3, 1, 2])],
      }));
      expect(model.roots).toEqual([3, 1, 2]);
    });

    test("reorders children of a parent", () => {
      model.applyDiff(diff({
        added: [node(1), node(2, { parentId: 1 }), node(3, { parentId: 1 })],
        childrenUpdated: [children(1, [2, 3])],
      }));
      model.applyDiff(diff({
        childrenUpdated: [children(1, [3, 2])],
      }));
      expect(model.nodeById(1)!.children).toEqual([3, 2]);
    });

    test("filters out IDs not present in the tree", () => {
      model.applyDiff(diff({
        added: [node(1), node(2, { parentId: 1 })],
        childrenUpdated: [children(1, [2])],
      }));
      model.applyDiff(diff({
        childrenUpdated: [children(1, [2, 999])],
      }));
      expect(model.nodeById(1)!.children).toEqual([2]);
    });

    test("does not bump version when child order is already correct", () => {
      model.applyDiff(diff({
        added: [node(1), node(2, { parentId: 1 })],
        childrenUpdated: [children(1, [2])],
      }));
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({ childrenUpdated: [children(1, [2])] }));
      expect(model.semanticVersion).toBe(vBefore);
    });

    test("updates parentId on children after reorder", () => {
      model.applyDiff(diff({ added: [node(1), node(2), node(3)] }));
      model.applyDiff(diff({
        childrenUpdated: [children(1, [2, 3])],
      }));
      expect(model.nodeById(2)!.parentId).toBe(1);
      expect(model.nodeById(3)!.parentId).toBe(1);
    });
  });

  // ---- Update semantic information about a node ----

  describe("applyDiff: updatedSemantic", () => {
    beforeEach(() => {
      model.applyDiff(diff({
        added: [node(1, {
          role: SemanticRole.text,
          label: "original",
          value: "v",
          hint: "h",
          stateFlags: SemanticState.None,
          traitFlags: SemanticTrait.None,
          headingLevel: 0,
          minX: 10, minY: 20, maxX: 110, maxY: 120,
        })],
      }));
    });

    test("updates all semantic fields", () => {
      model.applyDiff(diff({
        updatedSemantic: [node(1, {
          role: SemanticRole.button,
          label: "new label",
          value: "new v",
          hint: "new h",
          stateFlags: SemanticState.Focused,
          traitFlags: SemanticTrait.Focusable,
          headingLevel: 2,
        })],
      }));
      const n = model.nodeById(1)!;
      expect(n.role).toBe(SemanticRole.button);
      expect(n.label).toBe("new label");
      expect(n.value).toBe("new v");
      expect(n.hint).toBe("new h");
      expect(n.stateFlags).toBe(SemanticState.Focused);
      expect(n.traitFlags).toBe(SemanticTrait.Focusable);
      expect(n.headingLevel).toBe(2);
    });

    test("does not update node geometry on a semantic update", () => {
      model.applyDiff(diff({
        updatedSemantic: [node(1, { label: "changed", minX: 999, maxX: 999 })],
      }));
      const n = model.nodeById(1)!;
      expect(n.minX).toBe(10);
      expect(n.maxX).toBe(110);
    });

    test("does not bump tree version when fields are identical", () => {
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({
        updatedSemantic: [node(1, { role: SemanticRole.text, label: "original", value: "v", hint: "h" })],
      }));
      expect(model.semanticVersion).toBe(vBefore);
    });

    test("focus-only state change bumps version and stores stateFlags", () => {
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({
        updatedSemantic: [node(1, {
          role: SemanticRole.text,
          label: "original",
          value: "v",
          hint: "h",
          stateFlags: SemanticState.Focused,
        })],
      }));
      expect(model.nodeById(1)!.stateFlags).toBe(SemanticState.Focused);
      expect(model.semanticVersion).toBe(vBefore + 1);
    });

    test("skips an unknown node ID without bumping version", () => {
      const vBefore = model.semanticVersion;
      model.applyDiff(diff({ updatedSemantic: [node(999, { label: "ghost" })] }));
      expect(model.semanticVersion).toBe(vBefore);
    });
  });

  // ---- updatedGeometry ----

  describe("applyDiff: updatedGeometry", () => {
    beforeEach(() => {
      model.applyDiff(diff({
        added: [node(1, { role: SemanticRole.button, label: "btn", minX: 0, minY: 0, maxX: 100, maxY: 50 })],
      }));
    });

    test("updates all four bounds", () => {
      model.applyDiff(diff({ updatedGeometry: [bounds(1, 5, 10, 200, 80)] }));
      const n = model.nodeById(1)!;
      expect(n.minX).toBe(5);
      expect(n.minY).toBe(10);
      expect(n.maxX).toBe(200);
      expect(n.maxY).toBe(80);
    });

    test("does not bump version when bounds are identical", () => {
      const semanticBefore = model.semanticVersion;
      const geometryBefore = model.geometryVersion;
      model.applyDiff(diff({ updatedGeometry: [bounds(1, 0, 0, 100, 50)] }));
      expect(model.semanticVersion).toBe(semanticBefore);
      expect(model.geometryVersion).toBe(geometryBefore);
    });

    test("bumps geometryVersion but not semanticVersion", () => {
      const semanticBefore = model.semanticVersion;
      const geometryBefore = model.geometryVersion;
      model.applyDiff(diff({ updatedGeometry: [bounds(1, 5, 10, 200, 80)] }));
      expect(model.semanticVersion).toBe(semanticBefore);
      expect(model.geometryVersion).toBe(geometryBefore + 1);
      expect(model.geometryChangedIds).toEqual(new Set([1]));
    });

    test("skips an unknown node ID without bumping version", () => {
      const semanticBefore = model.semanticVersion;
      const geometryBefore = model.geometryVersion;
      model.applyDiff(diff({ updatedGeometry: [bounds(999, 0, 0, 100, 50)] }));
      expect(model.semanticVersion).toBe(semanticBefore);
      expect(model.geometryVersion).toBe(geometryBefore);
    });
  });

  // ---- semanticVersion ----

  describe("semanticVersion", () => {
    test("increments on each meaningful diff", () => {
      expect(model.semanticVersion).toBe(0);
      model.applyDiff(diff({ added: [node(1)] }));
      expect(model.semanticVersion).toBe(1);
      model.applyDiff(diff({ removed: [1] }));
      expect(model.semanticVersion).toBe(2);
    });
  });

  // ---- semanticChangedIds ----

  describe("semanticChangedIds", () => {
    test("tracks only nodes whose semantic fields changed in the latest diff", () => {
      model.applyDiff(diff({
        added: [
          node(1, { label: "a", siblingIndex: 0 }),
          node(2, { label: "b", siblingIndex: 1 }),
        ],
      }));
      expect(model.semanticChangedIds).toEqual(new Set([1, 2]));

      model.applyDiff(diff({ updatedSemantic: [node(1, { label: "changed" })] }));
      expect(model.semanticChangedIds).toEqual(new Set([1]));
    });

    test("structural changes bump semanticVersion without marking nodes", () => {
      model.applyDiff(diff({
        added: [
          node(1, { label: "a", siblingIndex: 0 }),
          node(2, { label: "b", siblingIndex: 1 }),
        ],
      }));
      const semanticBefore = model.semanticVersion;

      // A reorder-only move is structural — attributes don't depend on
      // position, so no node should be marked semantically changed.
      model.applyDiff(diff({ moved: [node(2, { label: "b", siblingIndex: 0 })] }));
      expect(model.semanticVersion).toBe(semanticBefore + 1);
      expect(model.semanticChangedIds.size).toBe(0);
    });
  });
});
