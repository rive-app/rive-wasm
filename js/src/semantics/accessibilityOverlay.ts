import type * as rc from "../rive_advanced.mjs";
import type { SemanticTreeModel } from "./semanticTreeModel";
import type { SemanticNodeData } from "./types";
import {
  SemanticRole,
  SemanticState,
  SemanticTrait,
  SemanticActionType,
  RiveSemanticsOptions,
  hasState,
  hasTrait,
} from "./types";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface AccessibilityOverlayOptions {
  canvas: HTMLCanvasElement;
  /** Unique string per Rive instance (used for prefixed IDs). */
  instanceId: string;
  /** Optional options for controlling semantic tree behavior and rendering */
  semanticsOptions: RiveSemanticsOptions;
  /** Callback to fire a semantic action back into the state machine. */
  fireAction: (nodeId: number, actionType: SemanticActionType) => void;
  /** Callback when AT focuses a semantic node (routes to SemanticManager::requestFocus). */
  requestFocus: (nodeId: number) => void;
  /** Callback when AT focus leaves a semantic node. */
  clearFocus: () => void;
  /**
   * When false (default), the overlay only moves focus while focus is already
   * inside Rive (overlay or canvas); when true it may also pull focus from outside Rive.
   */
  allowFocusInterrupt?: boolean;
}

/**
 * Indication of what changed since the last overlay update.
 *
 * - `semanticChanged` — semantic tree content/structure changed; attributes,
 *   DOM order, and stale removal need reconciling.
 * - `nodeGeometryChanged` — node bounds changed in the tree model.
 * - `layoutChanged` — canvas size/position changed (or the transform container
 *   hasn't been created yet); the artboard→canvas transform must be recomputed.
 */
export interface OverlayChange {
  semanticChanged: boolean;
  nodeGeometryChanged: boolean;
  layoutChanged: boolean;
}

/**
 * Creates and manages an invisible DOM tree overlaying a Rive canvas. This is for
 * screen readers to discover and interact with the Rive content.
 *
 * Each semantic node in the {@link SemanticTreeModel} gets a corresponding
 * DOM element with appropriate ARIA role, states, and action handlers so
 * assistive technologies (i.e. screen readers) can discover
 * and interact with the Rive content.
 *
 * Each node receives a prefixed ID (`id=rive-{instanceId}-sem-{nodeId}`) to avoid host-page ID collisions.
 * The nodeID is Rive's semantic node ID from core runtime.
 * Each node is styled with `pointer-events: none`. Interactive nodes can receive
 * programmatic focus and keydown events without entering the browser Tab order.
 */
export class AccessibilityOverlay {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private semanticsOptions: RiveSemanticsOptions;
  private elements: Map<number, HTMLElement> = new Map();
  /** Visually-hidden description spans keyed by node ID, referenced by aria-describedby. */
  private descElements: Map<number, HTMLSpanElement> = new Map();
  private instanceId: string;
  private fireAction: (nodeId: number, actionType: SemanticActionType) => void;
  private requestFocus: (nodeId: number) => void;
  private clearFocus: () => void;
  private lastSemanticVersion = -1;
  private lastGeometryVersion = -1;
  /** Text elements whose fit-scale needs recomputing, batched per update (see flushTextGeometry). */
  private pendingTextGeometry: HTMLElement[] = [];
  /** Last measured box-size|text key per text element, to skip redundant re-measures. */
  private textGeometryKeys: WeakMap<HTMLElement, string> = new WeakMap();
  private lastCanvasPositioning: { width: number; height: number; offsetTop: number; offsetLeft: number } = {
    width: -1, height: -1, offsetTop: -1, offsetLeft: -1,
  }
  /**
   * Set when a ResizeObserver/window-resize signals the canvas geometry may have
   * changed, cleared once the transform is re-synced. Lets {@link needsUpdate}
   * report geometry changes without a per-frame `getBoundingClientRect()` reflow.
   * Starts true so the first update computes the transform.
   */
  private _geometryDirty = true;
  /** True while reconciling the DOM (reserved for future focus-sync guards). */
  private isUpdating = false;
  /** See {@link AccessibilityOverlayOptions.allowFocusInterrupt}. */
  private allowFocusInterrupt: boolean;
  /**
   * Single child div of the overlay container that carries the artboard→CSS
   * transform. All semantic node elements are children of this div and express
   * their positions in raw artboard-space coordinates. The CSS transform on
   * this container maps artboard units to CSS pixels in one GPU pass — no
   * per-node matrix multiplication required.
   */
  private transformContainer: HTMLDivElement | null = null;
  private _artboardBounds: rc.AABB = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  private repositionTimer: ReturnType<typeof setTimeout> | null = null;
  private canvasResizeObserver: ResizeObserver | null = null;
  private parentResizeObserver: ResizeObserver | null = null;
  /**
   * Detects canvas *position* drift. See {@link observePosition}.
   */
  private positionObserver: IntersectionObserver | null = null;
  private readonly _onWindowResize = (): void => this.scheduleReposition();

  constructor(options: AccessibilityOverlayOptions) {
    this.instanceId = options.instanceId;
    this.fireAction = options.fireAction;
    this.requestFocus = options.requestFocus;
    this.clearFocus = options.clearFocus;
    this.canvas = options.canvas;
    this.semanticsOptions = options.semanticsOptions;
    this.allowFocusInterrupt = options.allowFocusInterrupt ?? false;
    this.container = this.createContainer(options.canvas);
    this.attachPositionObservers();
  }

  getSemanticOverlayContainer(): HTMLDivElement {
    return this.container;
  }

  // ---- Container lifecycle ----

  // Keep the a11y tree overlay matched to the canvas's position and size:
  // 1. The canvas resized           — ResizeObserver
  // 2. The canvas's parent resized   — ResizeObserver
  // 3. The window resized            — resize event
  // 4. The canvas moved/drifted      — IntersectionObserver (see observePosition)

  private attachPositionObservers(): void {
    this.canvasResizeObserver = new ResizeObserver(() => this.scheduleReposition());
    this.canvasResizeObserver.observe(this.canvas);

    const parent = this.canvas.parentElement;
    if (parent) {
      this.parentResizeObserver = new ResizeObserver(() => this.scheduleReposition());
      this.parentResizeObserver.observe(parent);
    }

    window.addEventListener("resize", this._onWindowResize);

    this.observePosition();
  }

  /**
   * Arms an IntersectionObserver whose root box is bounded to the canvas, so it
   * fires when the canvas moves relative to the viewport — position drift that
   * no ResizeObserver reports. Lets us re-sync the overlay container on a move
   * instead of recalculating the canvas bounding box every frame.
   */
  private observePosition(): void {
    if (typeof IntersectionObserver === "undefined") return;
    this.positionObserver?.disconnect();
    this.positionObserver = null;

    const rect = this.canvas.getBoundingClientRect();
    // Can't frame a zero-area element; it will re-arm on the next reposition.
    if (!rect.width || !rect.height) return;

    // Shrink the viewport root box down to exactly the canvas: a negative inset
    // from each viewport edge to the matching canvas edge, in CSS shorthand
    // order (top, right, bottom, left). Rounded so sub-pixel jitter doesn't trip
    // the 1.0 threshold.
    const insetToPx = (v: number): string => `${-Math.round(v)}px`;
    const rootMargin = [
      rect.top,                          // top:    viewport top → canvas top
      window.innerWidth - rect.right,    // right:  viewport right → canvas right
      window.innerHeight - rect.bottom,  // bottom: viewport bottom → canvas bottom
      rect.left,                         // left:   viewport left → canvas left
    ]
      .map(insetToPx)
      .join(" ");

    // The observer emits an initial notification for the current (contained)
    // state; ignore that and only react to a subsequent move.
    let armed = false;
    this.positionObserver = new IntersectionObserver(
      () => {
        if (!armed) {
          armed = true;
          return;
        }
        this.scheduleReposition();
      },
      { threshold: 1.0, rootMargin }
    );
    this.positionObserver.observe(this.canvas);
  }

  private scheduleReposition(): void {
    // A resize/move may have changed canvas size/scale/position; force a
    // transform recompute on the next frame's update.
    this._geometryDirty = true;
    if (this.repositionTimer !== null) return;
    this.repositionTimer = setTimeout(() => {
      this.repositionTimer = null;
      this.syncContainerGeometry();
      // Re-arm the position observer at the canvas's new location.
      this.observePosition();
    }, 500); // Throttle to avoid rapid style recalculations
  }

  private syncContainerGeometry(): void {
    const rect = this.canvas.getBoundingClientRect();
    const top = this.canvas.offsetTop;
    const left = this.canvas.offsetLeft;
    if (
      rect.width === this.lastCanvasPositioning.width &&
      rect.height === this.lastCanvasPositioning.height &&
      top === this.lastCanvasPositioning.offsetTop &&
      left === this.lastCanvasPositioning.offsetLeft
    ) return;
    this.container.style.top = top + "px";
    this.container.style.left = left + "px";
    this.container.style.width = rect.width + "px";
    this.container.style.height = rect.height + "px";
    this.container.tabIndex = -1;
    this.lastCanvasPositioning.width = rect.width;
    this.lastCanvasPositioning.height = rect.height;
    this.lastCanvasPositioning.offsetTop = top;
    this.lastCanvasPositioning.offsetLeft = left;
  }

  private createContainer(canvas: HTMLCanvasElement): HTMLDivElement {
    const container = document.createElement("div");
    container.id = `rive-a11y-${this.instanceId}`;
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", this.semanticsOptions?.riveCanvasLabel ?? "Rive animation");
    // Size to the canvas's CSS layout box, not the parent container.
    const rect = canvas.getBoundingClientRect();
    container.style.cssText = [
      "position:absolute",
      `top:${canvas.offsetTop}px`,
      `left:${canvas.offsetLeft}px`,
      `width:${rect.width}px`,
      `height:${rect.height}px`,
      "overflow:hidden",
      "pointer-events:none",
      // Visually hidden but still in the accessibility tree.
      // `display:none` and `visibility:hidden` would hide from AT.
      "opacity:0",
    ].join(";");

    canvas.insertAdjacentElement("afterend", container);
    return container;
  }

  /**
   * Returns what changed since the last update, or null if nothing changed.
   *
   * Callers use this to avoid recomputing the (relatively expensive)
   * artboard→canvas transform on frames where only node bounds changed in the
   * tree: the transform only needs recomputing when `layoutChanged` is true.
   */
  needsUpdate(tree: SemanticTreeModel): OverlayChange | null {
    const semanticChanged = tree.semanticVersion !== this.lastSemanticVersion;
    const nodeGeometryChanged =
      tree.geometryVersion !== this.lastGeometryVersion;
    const layoutChanged = this._geometryDirty || !this.transformContainer;
    if (!semanticChanged && !nodeGeometryChanged && !layoutChanged) return null;
    return { semanticChanged, nodeGeometryChanged, layoutChanged };
  }

  /**
   * Update the overlay DOM to reflect the current state of the semantic tree.
   * Call once per frame after `applyDiff` when {@link needsUpdate} reports a
   * change, when layout/transform inputs are dirty, or when a fresh
   * `forwardMat` is supplied (even if the tree versions are unchanged).
   *
   * @param tree           The in-memory semantic tree model
   * @param forwardMat     Artboard→canvas-pixel transform from `computeAlignment`,
   *                       or null to reuse the existing CSS transform on the
   *                       transform container
   * @param dpr            Device pixel ratio used for the canvas backing store
   * @param artboardBounds The artboard's own bounding rectangle
   */
  update(
    tree: SemanticTreeModel,
    forwardMat: rc.Mat2D | null,
    dpr: number,
    artboardBounds: rc.AABB,
    change?: OverlayChange | null
  ): void {
    let overlayChange = change ?? this.needsUpdate(tree);
    if (!overlayChange && forwardMat) {
      overlayChange = {
        semanticChanged: false,
        nodeGeometryChanged: false,
        layoutChanged: true,
      };
    }
    if (!overlayChange) return;
    this.performUpdate(tree, forwardMat, dpr, artboardBounds, overlayChange);
  }

  private performUpdate(
    tree: SemanticTreeModel,
    forwardMat: rc.Mat2D | null,
    dpr: number,
    artboardBounds: rc.AABB,
    change: OverlayChange
  ): void {
    const { semanticChanged, nodeGeometryChanged } = change;
    // Per-node change sets only describe the most recent applyDiff. If more
    // than one semantic version elapsed since our last update (first build,
    // or a diff we never consumed), fall back to re-applying attributes on
    // every node rather than trusting an incomplete set.
    const reapplyAllAttributes =
      tree.semanticVersion - this.lastSemanticVersion > 1;
    this.lastSemanticVersion = tree.semanticVersion;
    this.lastGeometryVersion = tree.geometryVersion;

    this.isUpdating = true;

    this._artboardBounds = artboardBounds;

    // Container box + artboard transform only run when a fresh forwardMat was
    // supplied (layout/transform dirty). Node-only bounds updates reuse the
    // existing CSS transform and go through updateGeometryForChangedNodes.
    // Skipping syncContainerGeometry here on semantic-only frames avoids a
    // getBoundingClientRect() reflow on every animation frame. The throttled
    // scheduleReposition() path still keeps the container aligned when the page
    // layout shifts.
    if (forwardMat) {
      this.syncContainerGeometry();
      this.syncTransformContainer(forwardMat, dpr, artboardBounds);
      // Transform is now in sync with the latest layout.
      this._geometryDirty = false;
    }

    if (semanticChanged) {
      const rootEl = this.transformContainer ?? this.container;
      const activeIds = new Set<number>();

      this.rebuildChildren(
        rootEl,
        tree.roots as number[],
        tree,
        0, // parentLeft in artboard space (transform container origin)
        0, // parentTop  in artboard space
        activeIds,
        reapplyAllAttributes
      );

      const staleIds: number[] = [];
      this.elements.forEach((_el, id) => {
        if (!activeIds.has(id)) staleIds.push(id);
      });
      for (const id of staleIds) {
        const el = this.elements.get(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
        this.elements.delete(id);
        const desc = this.descElements.get(id);
        if (desc && desc.parentNode) desc.parentNode.removeChild(desc);
        this.descElements.delete(id);
      }
    } else if (nodeGeometryChanged) {
      this.updateGeometryForChangedNodes(tree);
    }

    // Text scaling needs layout reads; batch them into one pass after all
    // position/attribute writes so each frame forces at most one reflow.
    this.flushTextGeometry();

    this.isUpdating = false;
  }

  /** Remove the overlay from the DOM entirely. */
  destroy(): void {
    if (this.repositionTimer !== null) {
      clearTimeout(this.repositionTimer);
      this.repositionTimer = null;
    }
    window.removeEventListener("resize", this._onWindowResize);
    this.canvasResizeObserver?.disconnect();
    this.parentResizeObserver?.disconnect();
    this.positionObserver?.disconnect();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.elements.clear();
    this.descElements.clear();
    this.pendingTextGeometry.length = 0;
  }

  // ---- Tree → DOM reconciliation ----

  /**
   * Reconcile a parent DOM element's children with an ordered list of
   * semantic node IDs. Creates, updates, and reorders elements as needed.
   *
   * Node positions are expressed in artboard-space coordinates. The CSS
   * transform on the transform container maps artboard units to CSS pixels,
   * so no per-node matrix multiplication is required here.
   *
   * @param parentArtboardLeft  Absolute artboard minX of the parent node (0 for roots)
   * @param parentArtboardTop   Absolute artboard minY of the parent node (0 for roots)
   */
  private rebuildChildren(
    parentEl: HTMLElement,
    childIds: number[],
    tree: SemanticTreeModel,
    parentArtboardLeft: number,
    parentArtboardTop: number,
    activeIds: Set<number>,
    applyAllAttributes: boolean
  ): void {
    for (let i = 0; i < childIds.length; i++) {
      const nodeId = childIds[i];
      const nodeData = tree.nodeById(nodeId);
      if (!nodeData) continue;

      activeIds.add(nodeId);

      let el = this.elements.get(nodeId);
      const isNew = !el;
      if (!el) {
        el = this.createElement(nodeData);
        this.elements.set(nodeId, el);
      }

      // Attributes are only applied to new elements and nodes whose semantic
      // fields changed in the latest diff. Skipping redundant setAttribute
      // calls eliminates WebKit AX notifications that knock VoiceOver off its
      // current element.
      if (isNew || applyAllAttributes || tree.semanticChangedIds.has(nodeId)) {
        this.applyAttributes(el, nodeData);
      }
      this.applyPosition(el, nodeData, parentArtboardLeft, parentArtboardTop);

      // Only touch the DOM tree if the element isn't already in the correct
      // position. Moving a focused element can blur it and knock AT off the
      // current node.
      const currentChild = parentEl.children[i] as HTMLElement | undefined;
      if (currentChild !== el) {
        if (currentChild) {
          parentEl.insertBefore(el, currentChild);
        } else {
          parentEl.appendChild(el);
        }
      }

      // Reflect the runtime Focused state into DOM focus. Runs after insertion
      // so the element is attached, and skips elements that already hold focus.
      // The cheap trait/state flag checks gate the (per-node) DOM queries below,
      // so the activeElement/closest/contains walks only run for a node that is
      // actually focusable + focused — not for every node on every frame.
      if (
        hasTrait(nodeData.traitFlags, SemanticTrait.Focusable) &&
        hasState(nodeData.stateFlags, SemanticState.Focused)
      ) {
        const active = document.activeElement as Element | null;
        // While focus is inside one of our modal dialogs, don't pull it back
        // out to a background node.
        const focusedModal = active?.closest('[aria-modal="true"]');
        const trappedByModal =
          !!focusedModal &&
          this.container.contains(focusedModal) &&
          !focusedModal.contains(el);
        if (active !== el && !trappedByModal && this.canMoveFocus()) {
          el.focus();
        }
      }

      // Recurse into children with this node's absolute artboard position.
      if (nodeData.children.length > 0) {
        this.rebuildChildren(
          el,
          nodeData.children,
          tree,
          nodeData.minX,
          nodeData.minY,
          activeIds,
          applyAllAttributes
        );
      }

      // Focus a modal/alert dialog when it first appears (after children are
      // built so the focus target can be resolved from the subtree).
      if (isNew) this.autoFocusDialogOnAppear(el, nodeData, tree);
    }
  }

  /**
   * Reposition only the subtrees whose bounds changed in the latest diff.
   * Descendants are included because node CSS positions are parent-relative.
   */
  private updateGeometryForChangedNodes(tree: SemanticTreeModel): void {
    for (const nodeId of Array.from(tree.geometryChangedIds)) {
      const nodeData = tree.nodeById(nodeId);
      if (!nodeData) continue;

      let parentLeft = 0;
      let parentTop = 0;
      let parentEl: HTMLElement = this.transformContainer ?? this.container;
      if (nodeData.parentId >= 0) {
        const parent = tree.nodeById(nodeData.parentId);
        if (parent) {
          parentLeft = parent.minX;
          parentTop = parent.minY;
          parentEl = this.elements.get(nodeData.parentId) ?? parentEl;
        }
      }

      this.updateNodeGeometrySubtree(
        tree,
        nodeId,
        parentLeft,
        parentTop,
        parentEl
      );
    }
  }

  private updateNodeGeometrySubtree(
    tree: SemanticTreeModel,
    nodeId: number,
    parentArtboardLeft: number,
    parentArtboardTop: number,
    _parentEl: HTMLElement
  ): void {
    const nodeData = tree.nodeById(nodeId);
    if (!nodeData) return;
    const el = this.elements.get(nodeId);
    if (!el) return;

    this.applyPosition(el, nodeData, parentArtboardLeft, parentArtboardTop);

    for (const childId of nodeData.children) {
      this.updateNodeGeometrySubtree(
        tree,
        childId,
        nodeData.minX,
        nodeData.minY,
        el
      );
    }
  }

  /**
   * Whether the overlay may move focus now. Following focus already inside this
   * instance is always allowed; pulling it in from the host page is gated behind
   * allowFocusInterrupt (from the Rive class).
   */
  private canMoveFocus(): boolean {
    const active = document.activeElement as Element | null;
    const focusAlreadyInScope =
      active === this.canvas || this.container.contains(active);
    return focusAlreadyInScope || this.allowFocusInterrupt;
  }

  /**
   * Move focus into a newly appeared modal/alert dialog so screen readers
   * announce and read its content (web ATs don't auto-enter a freshly mounted
   * dialog). Skips when focus can't move (see canMoveFocus) or a descendant
   * already holds it. The dialog's aria-modal keeps focus trapped inside.
   */
  private autoFocusDialogOnAppear(
    el: HTMLElement,
    node: SemanticNodeData,
    tree: SemanticTreeModel
  ): void {
    if (!isModalDialogRole(node.role, node.stateFlags)) return;
    if (!this.canMoveFocus()) return;

    // A descendant already holds focus — don't override it.
    const active = document.activeElement;
    if (active && active !== el && el.contains(active)) return;

    const target = this.routeDefaultFocusTarget(node, tree) ?? el;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    if (document.activeElement !== target) target.focus({ preventScroll: true });
  }

  /**
   * Resolve the element assistive technologies (AT) should focus on appearance. Walks the subtree
   * depth-first and returns the first focusable node's host element, else the
   * inner <span> of the first labeled leaf. Container and unlabeled nodes are
   * descended into but never focused. Returns null if nothing qualifies.
   */
  private routeDefaultFocusTarget(
    node: SemanticNodeData,
    tree: SemanticTreeModel
  ): HTMLElement | null {
    for (const childId of node.children) {
      const child = tree.nodeById(childId);
      if (!child) continue;
      const childEl = this.elements.get(childId);

      // Focusable node → its host element (even if it has children).
      if (childEl && isFocusableNode(child)) return childEl;

      // Container or unlabeled node → descend without focusing it.
      if (child.children.length > 0 || !child.label) {
        const nested = this.routeDefaultFocusTarget(child, tree);
        if (nested) return nested;
        continue;
      }

      // Labeled leaf → its inner label span.
      if (childEl) {
        return (childEl.querySelector(":scope > span") as HTMLElement | null) ?? childEl;
      }
    }
    return null;
  }

  // ---- Element creation ----

  /** Shared `id` prefix for all semantic node elements of this instance. */
  private get nodeIdPrefix(): string {
    return `rive-${this.instanceId}-sem-`;
  }

  /** Recover the semantic node ID from an overlay element, or null. */
  private nodeIdFromElement(el: Element): number | null {
    if (!el.id.startsWith(this.nodeIdPrefix)) return null;
    const raw = el.id.slice(this.nodeIdPrefix.length);
    // Guard the empty string explicitly: Number("") is 0, not NaN.
    if (!raw) return null;
    const id = Number(raw);
    return Number.isNaN(id) ? null : id;
  }

  private createElement(node: SemanticNodeData): HTMLElement {
    const tag = tagForRole(node.role);
    const el = document.createElement(tag);
    el.id = `${this.nodeIdPrefix}${node.id}`;
    el.style.cssText = BASE_NODE_STYLE;

    if (node.role === SemanticRole.text) {
      // The positioned outer div is the AX element
      // VoiceOver uses for its highlight box; an inner <span> carries the text
      // without position:absolute (which would strip the span from VoiceOver's
      // bounds calculation).
      const textSpan = document.createElement("span");
      textSpan.style.cssText = SPAN_EXP;
      el.appendChild(textSpan);
    }

    this.attachActionHandlers(el, node);
    return el;
  }

  // ---- Action handlers ----

  /**
   * Wire arrow-key roving focus for a group member (tab, radio). Arrow keys
   * move focus to the next/previous member (wrapping), optionally Home/End jump
   * to first/last, and the newly focused member receives a tap action.
   */
  private attachRovingNav(
    el: HTMLElement,
    opts: { members: () => HTMLElement[]; includeHomeEnd: boolean }
  ): void {
    el.addEventListener("keydown", (e) => {
      let target: "next" | "prev" | "first" | "last" | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") target = "next";
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") target = "prev";
      else if (opts.includeHomeEnd && e.key === "Home") target = "first";
      else if (opts.includeHomeEnd && e.key === "End") target = "last";
      if (!target) return;

      e.preventDefault();
      const members = opts.members();
      const idx = members.indexOf(el);
      if (idx < 0) return;

      const n = members.length;
      const next =
        target === "next" ? members[(idx + 1) % n]
        : target === "prev" ? members[(idx - 1 + n) % n]
        : target === "first" ? members[0]
        : members[n - 1];

      if (next && next !== el) {
        next.focus();
        const nextId = this.nodeIdFromElement(next);
        if (nextId !== null) this.fireAction(nextId, SemanticActionType.tap);
      }
    });
  }

  private attachActionHandlers(el: HTMLElement, node: SemanticNodeData): void {
    const role = node.role;
    const nodeId = node.id;

    if (isClickableRole(role)) {
      el.addEventListener("click", () => {
        this.fireAction(nodeId, SemanticActionType.tap);
      });
      // Links activate on Enter only (Space scrolls the page per browser
      // convention). All other clickable roles accept both Enter and Space.
      const activationKeys =
        role === SemanticRole.link ? ["Enter"] : ["Enter", " "];
      el.addEventListener("keydown", (e) => {
        if (activationKeys.includes(e.key)) {
          e.preventDefault();
          this.fireAction(nodeId, SemanticActionType.tap);
        }
      });
    }

    if (role === SemanticRole.slider) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          this.fireAction(nodeId, SemanticActionType.increase);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          this.fireAction(nodeId, SemanticActionType.decrease);
        }
      });
    }

    if (role === SemanticRole.tab) {
      this.attachRovingNav(el, {
        includeHomeEnd: true,
        members: () => {
          const parent = el.parentElement;
          if (!parent) return [];
          return Array.from(parent.children).filter(
            (c): c is HTMLElement =>
              c instanceof HTMLElement && c.getAttribute("role") === "tab"
          );
        },
      });
    }

    if (role === SemanticRole.radioButton) {
      this.attachRovingNav(el, {
        includeHomeEnd: false,
        members: () => {
          const group =
            el.closest<HTMLElement>('[role="radiogroup"]') ?? el.parentElement;
          if (!group) return [];
          return Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'));
        },
      });
    }

    // Focus handler for nodes with the Focusable trait. When AT focuses an
    // element, notify the C++ runtime so it can update internal focus state
    // (visual focus rings, etc.). Gated on Focusable trait
    if (hasTrait(node.traitFlags, SemanticTrait.Focusable)) {
      el.addEventListener("focus", () => {
        this.requestFocus(nodeId);
      });
    }
  }

  // ---- Attribute application ----

  private applyAttributes(el: HTMLElement, node: SemanticNodeData): void {
    const role = node.role;
    const flags = node.stateFlags;
    const traits = node.traitFlags;

    // Role
    const ariaRole = ariaRoleForSemantic(role);
    if (ariaRole) {
      setAttr(el, "role", ariaRole);
    } else {
      removeAttr(el, "role");
    }

    // Links: a bare <a> with no href has no link semantics, so set the role
    // explicitly (ariaRoleForSemantic returns null for link → native <a>).
    if (role === SemanticRole.link) {
      setAttr(el, "role", "link");
    }

    // Tabindex — keep the screen-reader overlay out of the browser's sequential
    // Tab order. Interactive/focusable nodes remain programmatically focusable
    // so AT/runtime focus sync can still target them when needed. List items are
    // included because Mobile Safari won't iterate them otherwise.
    if (
      isInteractiveRole(role) ||
      hasTrait(traits, SemanticTrait.Focusable) ||
      role === SemanticRole.listItem
    ) {
      setAttr(el, "tabindex", "-1");
    } else {
      removeAttr(el, "tabindex");
    }

    // Label / value / hint
    if (node.label) {
      setAttr(el, "aria-label", node.label);
    } else {
      removeAttr(el, "aria-label");
    }

    if (role === SemanticRole.slider) {
      if (node.value) {
        // aria-valuenow must be numeric; keep the display string (e.g. "75%")
        // in aria-valuetext only.
        const numericValue = parseFloat(node.value);
        if (Number.isFinite(numericValue)) {
          setAttr(el, "aria-valuenow", String(numericValue));
        } else {
          removeAttr(el, "aria-valuenow");
        }
        setAttr(el, "aria-valuetext", node.value);
      } else {
        removeAttr(el, "aria-valuenow");
        removeAttr(el, "aria-valuetext");
      }
      // TODO: aria-valuemin / aria-valuemax are required by ARIA.
      // Defaulting to horizontal; vertical sliders need orientation data from C++.
      setAttr(el, "aria-orientation", "horizontal");
      setBoolAttr(el, "aria-readonly", hasState(flags, SemanticState.ReadOnly));
    } else {
      removeAttr(el, "aria-valuenow");
      removeAttr(el, "aria-valuetext");
      removeAttr(el, "aria-orientation");
      removeAttr(el, "aria-readonly");
    }

    if (node.hint) {
      const descId = `rive-${this.instanceId}-desc-${node.id}`;
      let descEl = this.descElements.get(node.id);
      if (!descEl) {
        descEl = document.createElement("span");
        descEl.id = descId;
        descEl.style.cssText = DESC_SPAN_STYLE;
        this.container.appendChild(descEl);
        this.descElements.set(node.id, descEl);
      }
      if (descEl.textContent !== node.hint) descEl.textContent = node.hint;
      setAttr(el, "aria-describedby", descId);
    } else {
      removeAttr(el, "aria-describedby");
      const staleDesc = this.descElements.get(node.id);
      if (staleDesc) {
        if (staleDesc.parentNode) staleDesc.parentNode.removeChild(staleDesc);
        this.descElements.delete(node.id);
      }
    }

    // Text nodes: use textContent rather than aria-label so screen readers
    // announce the text in virtual/browse mode (aria-label on a bare <span>
    // with no widget role is ignored by some AT in document browse mode).
    if (role === SemanticRole.text) {
      const textSpan = el.querySelector(":scope > span") ?? el;
      const text = node.label ?? "";
      if (textSpan.textContent !== text) textSpan.textContent = text;
      removeAttr(el, "aria-label");
      if (node.headingLevel > 0) {
        setAttr(el, "role", "heading");
        setAttr(el, "aria-level", String(node.headingLevel));
      } else {
        // The generic role branch above already cleared role="heading";
        // aria-level must go with it when a heading reverts to plain text.
        removeAttr(el, "aria-level");
      }
    }

    // ---- Trait-gated states ----
    // Only set the ARIA property when the trait is present. When the trait
    // is absent, remove the attribute so AT sees "not applicable" rather
    // than "false".

    if (hasTrait(traits, SemanticTrait.Expandable) && ARIA_EXPANDED_ROLES.has(role)) {
      setBoolAttr(el, "aria-expanded", hasState(flags, SemanticState.Expanded));
    } else {
      removeAttr(el, "aria-expanded");
    }

    // aria-selected is required on ALL tabs per ARIA spec regardless of trait;
    // for other roles it is trait-gated and guarded to ARIA_SELECTED_ROLES.
    if (role === SemanticRole.tab) {
      setBoolAttr(el, "aria-selected", hasState(flags, SemanticState.Selected));
    } else if (hasTrait(traits, SemanticTrait.Selectable) && ARIA_SELECTED_ROLES.has(role)) {
      setBoolAttr(el, "aria-selected", hasState(flags, SemanticState.Selected));
    } else {
      removeAttr(el, "aria-selected");
    }

    if (hasTrait(traits, SemanticTrait.Checkable) && ARIA_CHECKED_ROLES.has(role)) {
      // Mixed wins over Checked per the C++ precedence contract, but
      // role="switch" only accepts true/false — "mixed" is invalid per ARIA.
      if (hasState(flags, SemanticState.Mixed) && role !== SemanticRole.switchControl) {
        setAttr(el, "aria-checked", "mixed");
      } else {
        setBoolAttr(el, "aria-checked", hasState(flags, SemanticState.Checked));
      }
    } else {
      removeAttr(el, "aria-checked");
    }

    if (hasTrait(traits, SemanticTrait.Toggleable)) {
      if (ARIA_PRESSED_ROLES.has(role)) {
        setBoolAttr(el, "aria-pressed", hasState(flags, SemanticState.Toggled));
      } else {
        removeAttr(el, "aria-pressed");
      }
      // switch uses aria-checked (not aria-pressed) for its on/off state.
      if (role === SemanticRole.switchControl) {
        setBoolAttr(el, "aria-checked", hasState(flags, SemanticState.Toggled));
      }
    } else {
      removeAttr(el, "aria-pressed");
    }

    if (hasTrait(traits, SemanticTrait.Requirable) && ARIA_REQUIRED_ROLES.has(role)) {
      setBoolAttr(el, "aria-required", hasState(flags, SemanticState.Required));
    } else {
      removeAttr(el, "aria-required");
    }

    if (hasTrait(traits, SemanticTrait.Enablable)) {
      setBoolAttr(
        el,
        "aria-disabled",
        hasState(flags, SemanticState.Disabled)
      );
    } else {
      removeAttr(el, "aria-disabled");
    }

    // ---- Non-trait states ----

    // Hide from AT when explicitly hidden, or when an image has no accessible
    // name — a nameless role="img" is a WCAG 1.1.1 violation; treat it as
    // decorative instead.
    const isDecorativeImage = role === SemanticRole.image && !node.label;
    if (hasState(flags, SemanticState.Hidden) || hasState(flags, SemanticState.Obscured) || isDecorativeImage) {
      setAttr(el, "aria-hidden", "true");
    } else {
      removeAttr(el, "aria-hidden");
    }

    if (hasState(flags, SemanticState.LiveRegion)) {
      setAttr(el, "aria-live", "polite");
    } else {
      removeAttr(el, "aria-live");
    }

    // textField-specific
    // TODO: Details here may change once we implement text inputs
    if (role === SemanticRole.textField) {
      setBoolAttr(el, "aria-readonly", hasState(flags, SemanticState.ReadOnly));
      setBoolAttr(
        el,
        "aria-multiline",
        hasState(flags, SemanticState.Multiline)
      );
      // Surface the current field value as DOM text so screen readers can
      // announce it. Only safe when the node has no semantic children —
      // setting textContent would remove any child elements from the DOM.
      if (node.children.length === 0) {
        const value = node.value ?? "";
        if (el.textContent !== value) el.textContent = value;
      }
    } else {
      removeAttr(el, "aria-multiline");
    }

    // alertDialog is always modal per WAI-ARIA; a plain dialog only when the Modal state flag is set.
    if (isModalDialogRole(role, flags)) {
      setAttr(el, "aria-modal", "true");
    } else {
      removeAttr(el, "aria-modal");
    }
  }

  // ---- Positioning ----

  /**
   * Positions an element in artboard-space coordinates relative to its parent.
   *
   * Node bounds stay in raw artboard units — the CSS `transform: matrix(...)`
   * on the transform container maps artboard units to CSS pixels in one GPU
   * pass. No per-node forwardMat multiplication or DPR division needed here.
   *
   * Round to whole artboard units before comparing to avoid triggering AX
   * layout notifications from sub-unit floating-point animation jitter.
   */
  private applyPosition(
    el: HTMLElement,
    node: SemanticNodeData,
    parentArtboardLeft: number,
    parentArtboardTop: number
  ): void {
    // Clamp each node's rect to the artboard viewport before computing CSS.
    // Without this, nodes whose artboard bounds exceed the artboard (e.g. a
    // scroll list container whose height is the full content, not the viewport)
    // produce CSS heights that overflow the transform container. WebKit then
    // unions all descendant AX rects and extends the container's AX origin
    // above the canvas regardless of overflow:hidden on ancestors.
    const ab = this._artboardBounds;
    const clampedMinX = Math.max(node.minX, ab.minX);
    const clampedMinY = Math.max(node.minY, ab.minY);
    const clampedMaxX = Math.min(node.maxX, ab.maxX);
    const clampedMaxY = Math.min(node.maxY, ab.maxY);

    const elLeft   = clampedMinX - parentArtboardLeft;
    const elTop    = clampedMinY - parentArtboardTop;
    const elWidth  = Math.max(0, clampedMaxX - clampedMinX);
    const elHeight = Math.max(0, clampedMaxY - clampedMinY);

    const tx = Math.round(elLeft);
    const ty = Math.round(elTop);
    const pxWidth  = Math.round(elWidth)  + "px";
    const pxHeight = Math.round(elHeight) + "px";

    // Use left/top layout properties for positioning. VoiceOver reliably
    // handles layout position + a single ancestor CSS transform (the transform
    // container). Chaining CSS transforms across multiple stacking contexts
    // (transform container → node identity → item translate) caused VoiceOver
    // to compute the correct SIZE but wrong POSITION. Artboard clamping above
    // guarantees tx/ty are always ≥ 0, so the negative-top overflow problem
    // that originally prompted the switch to CSS transforms no longer applies.
    const pxLeft = tx + "px";
    const pxTop  = ty + "px";
    if (el.style.left   !== pxLeft)   el.style.left   = pxLeft;
    if (el.style.top    !== pxTop)    el.style.top    = pxTop;
    if (el.style.width  !== pxWidth)  el.style.width  = pxWidth;
    if (el.style.height !== pxHeight) el.style.height = pxHeight;
    // Clear any CSS transform from a previous render pass.
    if (el.style.transform) el.style.transform = "";

    if (node.role === SemanticRole.text) {
      this.pendingTextGeometry.push(el);
    }
  }

  /**
   * Scale each queued text span to fit its layout box, batched so a frame
   * pays at most one synchronous layout: all measurement-reset writes first,
   * then all rect reads, then all transform writes. Interleaving
   * write→read→write per node would force a reflow per text node instead.
   *
   * Nodes whose box size and text are unchanged since the last pass are
   * skipped entirely (their existing transform is still correct — the scale
   * is a ratio of two rects, so ancestor transform changes cancel out).
   */
  private flushTextGeometry(): void {
    if (this.pendingTextGeometry.length === 0) return;

    // Phase 1 — writes: reset spans to their natural size for measurement.
    // The previous pass's scale must be cleared, or the rect reads below
    // would measure the scaled span and compound the correction.
    const toMeasure: Array<{ host: HTMLElement; span: HTMLElement; key: string }> = [];
    for (const host of this.pendingTextGeometry) {
      const span = (host.querySelector(":scope > span") as HTMLElement | null) ?? host;
      const key = `${host.style.width}|${host.style.height}|${span.textContent}`;
      if (this.textGeometryKeys.get(host) === key) continue;
      span.style.width = "auto";
      span.style.height = "auto";
      span.style.transformOrigin = "0 0";
      span.style.transform = "";
      toMeasure.push({ host, span, key });
    }
    this.pendingTextGeometry.length = 0;

    // Phase 2 — reads: one layout pass covers every rect measurement.
    const transforms = toMeasure.map(({ host, span }) => {
      const parentRect = host.getBoundingClientRect();
      const natural = span.getBoundingClientRect();
      if (natural.width > 0 && natural.height > 0) {
        const scaleX = parentRect.width / natural.width;
        const scaleY = parentRect.height / natural.height;
        return `scale(${scaleX}, ${scaleY})`;
      }
      return "none";
    });

    // Phase 3 — writes: apply all transforms.
    for (let i = 0; i < toMeasure.length; i++) {
      const { host, span, key } = toMeasure[i];
      span.style.transform = transforms[i];
      this.textGeometryKeys.set(host, key);
    }
  }

  // ---- Transform container ----

  /**
   * Creates (on first call) and updates the artboard-space transform container.
   *
   * The container is sized to the artboard dimensions and carries a CSS
   * `transform: matrix(...)` equivalent to `forwardMat / dpr`. All semantic
   * node elements are children of this container and use raw artboard
   * coordinates as their CSS `left/top/width/height`, so the CSS compositor
   * applies the artboard→screen mapping in one pass.
   */
  private syncTransformContainer(
    forwardMat: rc.Mat2D,
    dpr: number,
    artboardBounds: rc.AABB
  ): void {
    if (!this.transformContainer) {
      const tc = document.createElement("div");
      tc.style.cssText = [
        "position:absolute",
        "top:0",
        "left:0",
        // overflow:visible — artboard viewport clamping is done per-node in
        // applyPosition
        "overflow:visible",
        "pointer-events:none",
        "transform-origin:0 0",
      ].join(";");
      this.container.appendChild(tc);
      this.transformContainer = tc;
    }

    const w = artboardBounds.maxX - artboardBounds.minX;
    const h = artboardBounds.maxY - artboardBounds.minY;
    this.transformContainer.style.width  = Math.round(w) + "px";
    this.transformContainer.style.height = Math.round(h) + "px";

    const s = 1 / (dpr || 1);
    const a  = forwardMat.xx * s;
    const b  = forwardMat.xy * s;
    const c  = forwardMat.yx * s;
    const d  = forwardMat.yy * s;
    const tx = forwardMat.tx * s;
    const ty = forwardMat.ty * s;
    this.transformContainer.style.transform =
      `matrix(${a},${b},${c},${d},${tx},${ty})`;
  }
}

// ---------------------------------------------------------------------------
// Static helpers (module-private)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ARIA attribute eligibility — role sets
//
// Each set lists the Rive roles for which a given ARIA attribute is valid per
// WAI-ARIA 1.2 ("Used in roles" + "Inherits into roles"). The trait-gated
// blocks in applyAttributes check these before setting an attribute so that
// C++ nodes with unexpected trait combinations never produce invalid markup.
//
// To add a new role: append it to the relevant set(s) here — no other changes
// needed in applyAttributes.
// ---------------------------------------------------------------------------

/** aria-expanded: button, link, checkbox, switch (inherits button), tab. */
const ARIA_EXPANDED_ROLES: Set<number> = new Set([
  SemanticRole.button,
  SemanticRole.link,
  SemanticRole.checkbox,
  SemanticRole.switchControl,
  SemanticRole.tab,
]);

/**
 * aria-selected: tab is the only role in our current set that natively
 * supports it. Tab is also handled by an explicit unconditional branch in
 * applyAttributes (ARIA requires it there regardless of Selectable trait), but
 * the set still lists it so the constraint is visible in one place.
 */
const ARIA_SELECTED_ROLES: Set<number> = new Set([
  SemanticRole.tab,
]);

/** aria-checked: checkbox, radio, switch. */
const ARIA_CHECKED_ROLES: Set<number> = new Set([
  SemanticRole.checkbox,
  SemanticRole.radioButton,
  SemanticRole.switchControl,
]);

/**
 * aria-pressed: button only. switch is a button subclass in ARIA but uses
 * aria-checked (not aria-pressed) for its on/off state — it is intentionally
 * excluded here and handled separately in the Toggleable block.
 */
const ARIA_PRESSED_ROLES: Set<number> = new Set([
  SemanticRole.button,
]);

/** aria-required: checkbox, textbox, radiogroup. */
const ARIA_REQUIRED_ROLES: Set<number> = new Set([
  SemanticRole.checkbox,
  SemanticRole.textField,
  SemanticRole.radioGroup,
]);

// ---------------------------------------------------------------------------

/** Style for visually-hidden description spans used with aria-describedby. */
const DESC_SPAN_STYLE = [
  "position:absolute",
  "width:1px",
  "height:1px",
  "overflow:hidden",
  "pointer-events:none",
  "left:-9999px",
].join(";");

const BASE_NODE_STYLE = [
  "position:absolute",
  "pointer-events:none",
  "box-sizing:border-box",
  "overflow:visible",
  "margin:0",
  "padding:0",
  "transform-origin: 0px 0px 0px",
  "border:none",
  "background:transparent",
  "color:transparent",
  // "list-style:none",
].join(";");

const SPAN_EXP = [
  "display:inline-block",
  "white-space:nowrap",
  "pointer-events:none",
].join(";");

/**
 * Attribute writers that skip same-value mutations. Even a no-op setAttribute
 * fires a mutation record, and whether AX layers dedupe those is
 * browser-specific — skipping the write is the only browser-proof guard.
 */
function setAttr(el: Element, attr: string, value: string): void {
  if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
}

function removeAttr(el: Element, attr: string): void {
  if (el.hasAttribute(attr)) el.removeAttribute(attr);
}

function setBoolAttr(el: HTMLElement, attr: string, value: boolean): void {
  setAttr(el, attr, value ? "true" : "false");
}

/** Roles that receive click/Enter/Space action handlers. */
function isClickableRole(role: number): boolean {
  switch (role) {
    case SemanticRole.button:
    case SemanticRole.link:
    case SemanticRole.checkbox:
    case SemanticRole.switchControl:
    case SemanticRole.tab:
    case SemanticRole.radioButton:
      return true;
    default:
      return false;
  }
}

/** Roles that receive tabindex="-1" for programmatic/AT focus (not Tab order). */
function isInteractiveRole(role: number): boolean {
  switch (role) {
    case SemanticRole.button:
    case SemanticRole.link:
    case SemanticRole.checkbox:
    case SemanticRole.switchControl:
    case SemanticRole.slider:
    case SemanticRole.tab:
    case SemanticRole.radioButton:
    case SemanticRole.textField:
      return true;
    default:
      return false;
  }
}

/**
 * A modal/alert dialog: alertDialog is always modal per WAI-ARIA, a plain
 * dialog only when the Modal state flag is set.
 */
function isModalDialogRole(role: number, flags: number): boolean {
  return (
    role === SemanticRole.alertDialog ||
    (role === SemanticRole.dialog && hasState(flags, SemanticState.Modal))
  );
}

/** Whether a node can receive focus: an interactive role or the Focusable trait. */
function isFocusableNode(node: SemanticNodeData): boolean {
  return (
    isInteractiveRole(node.role) ||
    hasTrait(node.traitFlags, SemanticTrait.Focusable)
  );
}

/**
 * Choose an HTML tag for a given role. Prefer native semantic elements
 * where they exist — screen readers treat them more reliably than
 * generic elements with ARIA role overrides.
 */
function tagForRole(role: number): string {
  switch (role) {
    case SemanticRole.link:
      return "a";
    case SemanticRole.text:
      // The outer div is the positioned AX element VoiceOver measures for its
      // highlight box. The text itself lives in a child <span> (see createElement).
      return "div";
    default:
      return "div";
  }
}

/**
 * Maps a Rive SemanticRole to an ARIA `role` attribute value.
 * Returns null for roles that don't need an explicit role attribute here
 * (e.g. text nodes use an outer div + inner span with textContent; heading
 * role is applied separately when headingLevel > 0).
 */
function ariaRoleForSemantic(role: number): string | null {
  switch (role) {
    case SemanticRole.none:
      // TODO: Role "none" removes the node from the accessibility tree. For now, setting to Group, but maybe we want to switch to "none"
      // or "presentation".
      return "group";
    case SemanticRole.button:
      return "button";
    case SemanticRole.link:
      return null; // native <a>
    case SemanticRole.checkbox:
      return "checkbox";
    case SemanticRole.switchControl:
      return "switch";
    case SemanticRole.slider:
      return "slider";
    case SemanticRole.textField:
      return "textbox";
    case SemanticRole.image:
      return "img";
    case SemanticRole.group:
      return "group";
    case SemanticRole.list:
      return "list";
    case SemanticRole.listItem:
      return "listitem";
    case SemanticRole.tab:
      return "tab";
    case SemanticRole.tabList:
      return "tablist";
    case SemanticRole.dialog:
      return "dialog";
    case SemanticRole.alertDialog:
      return "alertdialog";
    case SemanticRole.radioGroup:
      return "radiogroup";
    case SemanticRole.radioButton:
      return "radio";
    case SemanticRole.text:
      // Text nodes use <span>; heading role is applied separately
      // when headingLevel > 0.
      return null;
    default:
      return null;
  }
}
