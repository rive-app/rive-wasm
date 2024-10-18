/**
 * Enum representing the different fit options for a canvas element.
 */
export enum Fit {
  /**
   * Scales the image to fill the entire canvas, maintaining aspect ratio.
   */
  Cover = "cover",
  /**
   * Scales the image to fit within the canvas, maintaining aspect ratio.
   */
  Contain = "contain",
  /**
   * Stretches the image to fill the entire canvas, ignoring aspect ratio.
   */
  Fill = "fill",
  /**
   * Scales the image to fit the width of the canvas, maintaining aspect ratio.
   */
  FitWidth = "fitWidth",
  /**
   * Scales the image to fit the height of the canvas, maintaining aspect ratio.
   */
  FitHeight = "fitHeight",
  /**
   * Displays the image at its original size.
   */
  None = "none",
  /**
   * Scales down the image if it's larger than the canvas, but never scales it up.
   */
  ScaleDown = "scaleDown",
}
