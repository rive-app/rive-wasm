import { Fit, Alignment } from "./enums";
import type { LayoutParameters } from "./types";
import * as rc from "./../rive_advanced.mjs";

/**
 * Represents the layout parameters for a Rive animation in a HTML canvas.
 * The `Layout` class provides methods to manage the fit and alignment of the
 * Rive animation within the canvas.
 */
export class Layout {
  /**
   * Caches the runtime fit value of the Rive animation to save computation cycles.
   *
   * Runtime fit and alignment are accessed every frame, so we cache their values to save cycles.
   */
  private cachedRuntimeFit: rc.Fit;
  private cachedRuntimeAlignment: rc.Alignment;

  /**
   * The fit mode for the Rive animation within the canvas. This determines how the animation is scaled to fit the canvas.
   */
  public readonly fit: Fit;
  /**
   * The alignment mode for the Rive animation within the canvas. This determines how the animation is positioned within the canvas.
   */
  public readonly alignment: Alignment;
  /**
   * The minimum x-coordinate of the layout.
   */
  public readonly minX: number;
  /**
   * The minimum y-coordinate of the layout.
   */
  public readonly minY: number;
  /**
   * The maximum x-coordinate of the layout.
   */
  public readonly maxX: number;
  /**
   * The maximum y-coordinate of the layout.
   */
  public readonly maxY: number;

  /**
   * Constructs a new `Layout` instance with the provided parameters.
   */
  constructor(params?: LayoutParameters) {
    this.fit = params?.fit ?? Fit.Contain;
    this.alignment = params?.alignment ?? Alignment.Center;
    this.minX = params?.minX ?? 0;
    this.minY = params?.minY ?? 0;
    this.maxX = params?.maxX ?? 0;
    this.maxY = params?.maxY ?? 0;
  }

  /**
   * Alternative constructor to build a Layout from an interface/object.
   * @deprecated
   */
  static new({
    fit,
    alignment,
    minX,
    minY,
    maxX,
    maxY,
  }: LayoutParameters): Layout {
    console.warn(
      "This function is deprecated: please use `new Layout({})` instead"
    );
    return new Layout({ fit, alignment, minX, minY, maxX, maxY });
  }

  /**
   * Makes a copy of the layout, replacing any specified parameters
   */
  public copyWith({
    fit,
    alignment,
    minX,
    minY,
    maxX,
    maxY,
  }: LayoutParameters): Layout {
    return new Layout({
      fit: fit ?? this.fit,
      alignment: alignment ?? this.alignment,
      minX: minX ?? this.minX,
      minY: minY ?? this.minY,
      maxX: maxX ?? this.maxX,
      maxY: maxY ?? this.maxY,
    });
  }

  /**
   * Returns the appropriate Fit value for the Rive runtime based on the `fit` property of the Layout.
   * The result is cached to avoid unnecessary conversions.
   * @param rive - The RiveCanvas instance to use for the Rive runtime fit values.
   * @returns The Fit value corresponding to the `fit` property of the Layout.
   */
  public runtimeFit(rive: rc.RiveCanvas): rc.Fit {
    if (this.cachedRuntimeFit) return this.cachedRuntimeFit;

    let fit;
    if (this.fit === Fit.Cover) fit = rive.Fit.cover;
    else if (this.fit === Fit.Contain) fit = rive.Fit.contain;
    else if (this.fit === Fit.Fill) fit = rive.Fit.fill;
    else if (this.fit === Fit.FitWidth) fit = rive.Fit.fitWidth;
    else if (this.fit === Fit.FitHeight) fit = rive.Fit.fitHeight;
    else if (this.fit === Fit.ScaleDown) fit = rive.Fit.scaleDown;
    else fit = rive.Fit.none;

    this.cachedRuntimeFit = fit;
    return fit;
  }

  /**
   * Returns the appropriate Alignment value for the Rive runtime based on the `alignment` property of the Layout.
   * The result is cached to avoid unnecessary conversions.
   * @param rive - The RiveCanvas instance to use for the Rive runtime alignment values.
   * @returns The Alignment value corresponding to the `alignment` property of the Layout.
   */
  public runtimeAlignment(rive: rc.RiveCanvas): rc.Alignment {
    if (this.cachedRuntimeAlignment) return this.cachedRuntimeAlignment;

    let alignment;
    if (this.alignment === Alignment.TopLeft)
      alignment = rive.Alignment.topLeft;
    else if (this.alignment === Alignment.TopCenter)
      alignment = rive.Alignment.topCenter;
    else if (this.alignment === Alignment.TopRight)
      alignment = rive.Alignment.topRight;
    else if (this.alignment === Alignment.CenterLeft)
      alignment = rive.Alignment.centerLeft;
    else if (this.alignment === Alignment.CenterRight)
      alignment = rive.Alignment.centerRight;
    else if (this.alignment === Alignment.BottomLeft)
      alignment = rive.Alignment.bottomLeft;
    else if (this.alignment === Alignment.BottomCenter)
      alignment = rive.Alignment.bottomCenter;
    else if (this.alignment === Alignment.BottomRight)
      alignment = rive.Alignment.bottomRight;
    else alignment = rive.Alignment.center;

    this.cachedRuntimeAlignment = alignment;
    return alignment;
  }
}
