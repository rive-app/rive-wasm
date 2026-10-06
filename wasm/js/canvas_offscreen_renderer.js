const INITIAL_ATLAS_SIZE = 512;

// Pad adjacent atlas entries to avoid bilinear filtering artifacts.
const ATLAS_GUTTER = 1;

const _noopDraw = function () { };

// Scratch array used by appendDraw()
const _slotBounds = new Int32Array(5);

// Calls the provided `measureBounds` function with the given scale, then clips against
// the canvas bounds. `out` is expected to be a 5-element Int32Array and is filled with:
// [minX, minY, maxX, maxY, wasClipped]
// Returns false if there is nothing left to draw after clipping.
function _measureAtlasSlot(
  measureBounds,
  scaleX,
  scaleY,
  canvasWidth,
  canvasHeight,
  out,
) {
  measureBounds(scaleX, scaleY, out);
  const minX = Math.max(out[0], 0);
  const minY = Math.max(out[1], 0);
  const maxX = Math.min(out[2], Math.ceil(canvasWidth * scaleX));
  const maxY = Math.min(out[3], Math.ceil(canvasHeight * scaleY));
  out[4] = (minX !== out[0] || minY !== out[1] || maxX !== out[2] || maxY !== out[3]) ? 1 : 0;
  out[0] = minX;
  out[1] = minY;
  out[2] = maxX;
  out[3] = maxY;
  return maxX > minX && maxY > minY;
}

// This class is used to delegate draw calls that cannot be performed natively by canvas
// 2D out to a WebGL backend. It does this by building up a list of draws that the backend
// renders to an atlas, then copies from the atlas back to the destination canvas.
//
// The backend provides:
//   supportsPaths: whether it has makeRivePathBuilder() and can draw Rive paths.
//   maxAtlasSize(): the largest atlas it can render, or 0 if it's unavailable.
//   canvas(): the canvas holding the rendered atlas, or null if it's unavailable.
//   render(width, height, entries): renders each entry's contents into its slot.
//   attachImage(renderImage, htmlImage) and releaseImage(renderImage).
class CanvasOffscreenRenderer {
  constructor(backend) {
    this.backend = backend;
    this._rectanizer = null;
    this._atlasEntries = [];
    this._maxAtlasSize = 0;
    this._pendingReleases = 0;
    // Aligned to multiples of 256 and held for a second.
    this._atlasMaxRecentWidth = new MaxRecentSize(1000, 8);
    this._atlasMaxRecentHeight = new MaxRecentSize(1000, 8);
  }

  pendingReleaseCount() {
    return this._pendingReleases;
  }

  setMaxAtlasSize(size) {
    if (this._maxAtlasSize === size) {
      return;
    }
    this._maxAtlasSize = size;
    // A rectanizer is built against the cap, so it has to be rebuilt rather than resized.
    this.cleanup();
  }

  _initialAtlasSize() {
    return this._maxAtlasSize !== 0
      ? Math.min(INITIAL_ATLAS_SIZE, this._maxAtlasSize)
      : INITIAL_ATLAS_SIZE;
  }

  _atlasSizeLimit() {
    const backendMaxSize = this.backend.maxAtlasSize();
    if (backendMaxSize === 0) {
      // Indicates that the backend isn't available
      return 0;
    }
    return this._maxAtlasSize || backendMaxSize;
  }

  // Returns the callback that copies this draw back onto `ctx`. `measureBounds` is given
  // a scale so the outsets it reports are sized for the resolution the draw renders at.
  // `contents` is opaque here and only has to make sense to the backend, and
  // `releaseContents` runs whether or not the draw is ever made.
  appendDraw(
    ctx,
    canvasWidth,
    canvasHeight,
    matrix,
    canvasBlend,
    opacity,
    measureBounds,
    contents,
    releaseContents,
    flush
  ) {
    this._pendingReleases++;
    const release = () => {
      this._pendingReleases--;
      releaseContents();
    };

    const maxRTSize = this._atlasSizeLimit();
    // A slot has to shrink when it cannot fit, gutter included.
    const maxSlotSize = maxRTSize - ATLAS_GUTTER;
    // Actually downscaling uses three extra texels (on each side). The first texel is
    // because when we render downscaled, we upscale it using linear interpolation. If we
    // clip against the canvas bounds, we don't want to linearly interpolate with a
    // transparent texel. The other two texels come from
    // RiveRenderPath::calculatePixelBounds, where we first add 1 texel for AA, then call
    // roundOut, which could add another.
    const downscaledSlotSize = maxSlotSize - 6;
    if (!(downscaledSlotSize > 0)) {
      release();
      return _noopDraw;
    }

    let scaleX = 1;
    let scaleY = 1;
    if (!_measureAtlasSlot(
      measureBounds,
      scaleX,
      scaleY,
      canvasWidth,
      canvasHeight,
      _slotBounds,
    )) {
      release();
      return _noopDraw;
    }

    // As a last resort, shrink the draw if it doesn't fit the atlas. Note that this will
    // cause feathered path geometry to be computed for a lower resolution, so there will
    // be visual differences beyond just downscaling.
    const measuredWidth = _slotBounds[2] - _slotBounds[0];
    const measuredHeight = _slotBounds[3] - _slotBounds[1];
    if (measuredWidth > maxSlotSize || measuredHeight > maxSlotSize) {
      scaleX *= Math.min(1, downscaledSlotSize / measuredWidth);
      scaleY *= Math.min(1, downscaledSlotSize / measuredHeight);
      if (!_measureAtlasSlot(
        measureBounds,
        scaleX,
        scaleY,
        canvasWidth,
        canvasHeight,
        _slotBounds,
      )) {
        release();
        return _noopDraw;
      }
    }

    let slotMinX = _slotBounds[0];
    let slotMinY = _slotBounds[1];
    let slotMaxX = _slotBounds[2];
    let slotMaxY = _slotBounds[3];
    // Element 4 indicates that the canvas edge clipped, so we need to enable scissoring
    // to avoid drawing into neighboring slots.
    const needsScissor = _slotBounds[4] !== 0;

    // When upscaling a downscaled slot, linear interpolation is used, so we add a texel
    // of padding to avoid interpolating into a transparent texel.
    if (scaleX < 1 || scaleY < 1) {
      slotMinX -= 1;
      slotMinY -= 1;
      slotMaxX += 1;
      slotMaxY += 1;
    }

    const widthInAtlas = slotMaxX - slotMinX;
    const heightInAtlas = slotMaxY - slotMinY;

    // Find a slot for the draw in the atlas.
    if (!this._rectanizer) {
      this._rectanizer = new Module["DynamicRectanizer"](maxRTSize);
      const initial = this._initialAtlasSize();
      this._rectanizer["reset"](initial, initial);
    }
    let pos = this._rectanizer["addRect"](widthInAtlas + ATLAS_GUTTER,
      heightInAtlas + ATLAS_GUTTER);
    if (pos < 0) {
      // Flushing empties the atlas, so one retry is always enough.
      flush();
      pos = this._rectanizer["addRect"](widthInAtlas + ATLAS_GUTTER,
        heightInAtlas + ATLAS_GUTTER);
      if (pos < 0) {
        console.assert(false, "draw does not fit in an empty atlas");
        release();
        return _noopDraw;
      }
    }
    const atlasX = pos & 0xffff;
    const atlasY = pos >> 16;

    this._atlasEntries.push({
      // Maps the draw's own coordinate space into its slot, so the backend can draw the
      // contents without knowing where they came from.
      atlasMatrix: [
        scaleX * matrix[0],
        scaleY * matrix[1],
        scaleX * matrix[2],
        scaleY * matrix[3],
        scaleX * matrix[4] - slotMinX + atlasX,
        scaleY * matrix[5] - slotMinY + atlasY,
      ],
      atlasX: atlasX,
      atlasY: atlasY,
      widthInAtlas: widthInAtlas,
      heightInAtlas: heightInAtlas,
      needsScissor: needsScissor,
      contents: contents,
      releaseContents: release,
    });

    const drawX = slotMinX / scaleX;
    const drawY = slotMinY / scaleY;
    const drawWidth = widthInAtlas / scaleX;
    const drawHeight = heightInAtlas / scaleY;

    // This returned function is added to the draw list to copy from the atlas back to
    // the canvas.
    const backend = this.backend;
    return function () {
      const atlasCanvas = backend.canvas();
      if (!atlasCanvas) {
        return;
      }
      ctx["save"]();
      ctx["resetTransform"]();
      ctx["globalCompositeOperation"] = canvasBlend;
      ctx["globalAlpha"] = opacity;
      ctx["drawImage"](
        atlasCanvas,
        atlasX,
        atlasY,
        widthInAtlas,
        heightInAtlas,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );
      ctx["restore"]();
    };
  }

  renderAtlas() {
    if (this._atlasEntries.length === 0) {
      return;
    }
    const maxRTSize = this._atlasSizeLimit();
    if (maxRTSize === 0) {
      return;
    }

    // Hold the canvas at the largest size used recently so that a change in packing
    // doesn't reallocate the drawing buffer every frame.
    this.backend.render(
      Math.min(this._atlasMaxRecentWidth.push(this._rectanizer["drawWidth"]()), maxRTSize),
      Math.min(this._atlasMaxRecentHeight.push(this._rectanizer["drawHeight"]()), maxRTSize),
      this._atlasEntries
    );
  }

  cleanup() {
    if (this._rectanizer) {
      this._rectanizer["delete"]();
      this._rectanizer = null;
    }
  }

  clearAtlas() {
    for (const entry of this._atlasEntries) {
      entry.releaseContents();
    }
    this._atlasEntries = [];
    if (this._rectanizer) {
      const initial = this._initialAtlasSize();
      this._rectanizer["reset"](initial, initial);
    }
  }
}
