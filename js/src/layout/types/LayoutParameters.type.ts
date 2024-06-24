import type { Fit, Alignment } from "../enums";

/**
 * Interface for the Layout static method contractor
 */
export interface LayoutParameters {
  /**
   * The fit mode for the layout.
   */
  fit?: Fit;
  /**
   * The alignment mode for the layout.
   */
  alignment?: Alignment;
  /**
   * The minimum X coordinate for the layout.
   */
  minX?: number;
  /**
   * The minimum Y coordinate for the layout.
   */
  minY?: number;
  /**
   * The maximum X coordinate for the layout.
   */
  maxX?: number;
  /**
   * The maximum Y coordinate for the layout.
   */
  maxY?: number;
}
