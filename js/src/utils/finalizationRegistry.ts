import * as rc from "../rive_advanced.mjs";

class Finalizable {
  selfUnref: boolean = false;
}

class ImageWrapper extends Finalizable {
  private _nativeImage: rc.Image;

  constructor(image: rc.Image) {
    super();
    this._nativeImage = image;
  }

  public get nativeImage(): rc.ImageInternal {
    return this._nativeImage;
  }

  public unref() {
    if (this.selfUnref) {
      this._nativeImage.unref();
    }
  }
}

class AudioWrapper extends Finalizable {
  private _nativeAudio: rc.Audio;

  constructor(audio: rc.Audio) {
    super();
    this._nativeAudio = audio;
  }

  public get nativeAudio(): rc.AudioInternal {
    return this._nativeAudio;
  }

  public unref() {
    if (this.selfUnref) {
      this._nativeAudio.unref();
    }
  }
}

class FontWrapper extends Finalizable {
  private _nativeFont: rc.Font;

  constructor(font: rc.Font) {
    super();
    this._nativeFont = font;
  }

  public get nativeFont(): rc.FontInternal {
    return this._nativeFont;
  }

  public unref() {
    if (this.selfUnref) {
      this._nativeFont.unref();
    }
  }
}

export type AssetLoadCallbackWrapper = (
  asset: rc.FileAssetInternal,
  bytes: Uint8Array,
) => Boolean;

class CustomFileAssetLoaderWrapper {
  assetLoader: rc.CustomFileAssetLoader;
  _assetLoaderCallback: AssetLoadCallbackWrapper;

  constructor(
    runtime: rc.RiveCanvas,
    loaderCallback: AssetLoadCallbackWrapper,
  ) {
    this._assetLoaderCallback = loaderCallback;
    this.assetLoader = new runtime.CustomFileAssetLoader({
      loadContents: this.loadContents.bind(this),
    });
  }

  loadContents(asset: rc.FileAsset, bytes: any) {
    let assetWrapper: FileAssetWrapper;
    if (asset.isImage) {
      assetWrapper = new ImageAssetWrapper(asset);
    } else if (asset.isAudio) {
      assetWrapper = new AudioAssetWrapper(asset);
    } else if (asset.isFont) {
      assetWrapper = new FontAssetWrapper(asset);
    }
    return this._assetLoaderCallback(assetWrapper, bytes);
  }
}

/**
 * Rive class representing a FileAsset with relevant metadata fields to describe
 * an asset associated wtih the Rive File
 */
class FileAssetWrapper {
  _nativeFileAsset: rc.FileAssetInternal;

  constructor(nativeAsset: rc.FileAssetInternal) {
    this._nativeFileAsset = nativeAsset;
  }

  decode(bytes: Uint8Array): void {
    this._nativeFileAsset.decode(bytes);
  }

  get name(): string {
    return this._nativeFileAsset.name;
  }

  get fileExtension(): string {
    return this._nativeFileAsset.fileExtension;
  }

  get uniqueFilename(): string {
    return this._nativeFileAsset.uniqueFilename;
  }

  get isAudio(): boolean {
    return this._nativeFileAsset.isAudio;
  }

  get isImage(): boolean {
    return this._nativeFileAsset.isImage;
  }

  get isFont(): boolean {
    return this._nativeFileAsset.isFont;
  }

  get cdnUuid(): string {
    return this._nativeFileAsset.cdnUuid;
  }

  get nativeFileAsset() {
    return this._nativeFileAsset;
  }
}

/**
 * Rive class extending the FileAsset that exposes a `setRenderImage()` API with a
 * decoded Image (via the `decodeImage()` API) to set a new Image on the Rive FileAsset
 */
class ImageAssetWrapper extends FileAssetWrapper {
  setRenderImage(image: ImageWrapper): void {
    (this._nativeFileAsset as rc.ImageAssetInternal).setRenderImage(
      image.nativeImage,
    );
  }
}

/**
 * Rive class extending the FileAsset that exposes a `setAudioSource()` API with a
 * decoded Audio (via the `decodeAudio()` API) to set a new Audio on the Rive FileAsset
 */
class AudioAssetWrapper extends FileAssetWrapper {
  setAudioSource(audio: AudioWrapper): void {
    (this._nativeFileAsset as rc.AudioAssetInternal).setAudioSource(
      audio.nativeAudio,
    );
  }
}

/**
 * Rive class extending the FileAsset that exposes a `setFont()` API with a
 * decoded Font (via the `decodeFont()` API) to set a new Font on the Rive FileAsset
 */
class FontAssetWrapper extends FileAssetWrapper {
  setFont(font: FontWrapper): void {
    (this._nativeFileAsset as rc.FontAssetInternal).setFont(font.nativeFont);
  }
}

declare const FinalizationRegistry: {
  new (fn: Function): typeof FinalizationRegistry;

  register<T extends Finalizable>(object: T, description: any): void;

  unregister<T>(object: T): void;
};

class FakeFinalizationRegistry {
  constructor(_: Function) {}
  register(object: Finalizable) {
    object.selfUnref = true;
  }

  unregister<T>(_: T) {}
}
const MyFinalizationRegistry =
  typeof FinalizationRegistry !== "undefined"
    ? FinalizationRegistry
    : FakeFinalizationRegistry;

const finalizationRegistry = new MyFinalizationRegistry((ob: any) => {
  ob.unref();
});

export {
  finalizationRegistry,
  Finalizable,
  ImageWrapper,
  AudioWrapper,
  FontWrapper,
  ImageAssetWrapper,
  AudioAssetWrapper,
  FontAssetWrapper,
  CustomFileAssetLoaderWrapper,
  FileAssetWrapper,
};
