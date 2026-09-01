const sharedOnRuntimeInitialized = Module["onRuntimeInitialized"];
Module["onRuntimeInitialized"] = function () {
  // If an initialize function is already configured, execute that first.
  sharedOnRuntimeInitialized && sharedOnRuntimeInitialized();

  // The optional session belongs to the deferred file this asset is bound
  // into; anything decoded against another factory is dropped when that file
  // draws. Null (never omitted) keeps the arity the bindings assert on.
  let decodeAudio = Module["decodeAudio"];
  Module["decodeAudio"] = function (bytes, onComplete, session = null) {
    const audio = decodeAudio(bytes, session ?? null);
    onComplete(audio);
  };

  let decodeFont = Module["decodeFont"];
  Module["decodeFont"] = function (bytes, onComplete, session = null) {
    const font = decodeFont(bytes, session ?? null);
    onComplete(font);
  };

  // FileAsset.decode() is raw embind with no wrapper of its own; default the
  // session so the pre-existing 1-arg call site keeps working.
  const assetDecode = Module["FileAsset"]["prototype"]["decode"];
  Module["FileAsset"]["prototype"]["decode"] = function (bytes, session) {
    return assetDecode.call(this, bytes, session ?? null);
  };

  let setFallbackFontCb = Module["setFallbackFontCb"];
  if (typeof setFallbackFontCb === "function") {
    Module["setFallbackFontCallback"] = function (callback) {
      setFallbackFontCb(callback);
    };
  } else {
    Module["setFallbackFontCallback"] = function (callback) {
      // Text support (WITH_RIVE_TEXT) is not enabled in this build,
      // so there is no underlying fallback font callback to register.
      // This is a no-op to avoid runtime errors in non-text builds.
      console.warn(
        "Module.setFallbackFontCallback called, but text support is not enabled in this build."
      );
    };
  }

  const FileAssetLoader = Module.FileAssetLoader;

  Module["ptrToAsset"] = (assetAddress) => {
    let asset = Module["ptrToFileAsset"](assetAddress);
    if (asset.isImage) {
      return Module["ptrToImageAsset"](assetAddress);
    } else if (asset.isFont) {
      return Module["ptrToFontAsset"](assetAddress);
    } else if (asset.isAudio) {
      return Module["ptrToAudioAsset"](assetAddress);
    }
    return asset;
  };

  Module["CustomFileAssetLoader"] = FileAssetLoader.extend(
    "CustomFileAssetLoader",
    {
      "__construct": function ({ loadContents }) {
        this["__parent"]["__construct"].call(this);
        this._loadContents = loadContents;
      },
      "loadContents": function (assetAddress, bytes) {
        let asset = Module["ptrToAsset"](assetAddress);
        return this._loadContents(asset, bytes);
      },
    }
  );

  Module["CDNFileAssetLoader"] = FileAssetLoader.extend("CDNFileAssetLoader", {
    // Constructed by the load() wrapper with the session that imports the
    // file, so CDN hosted assets decode into the same factory as the file.
    "__construct": function (session) {
      this["__parent"]["__construct"].call(this);
      this._session = session ?? null;
    },
    "loadContents": function (assetAddress) {
      let asset = Module["ptrToAsset"](assetAddress);

      let cdnUuid = asset.cdnUuid;
      if (cdnUuid === "") {
        return false;
      }

      function httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.responseType = "arraybuffer";
        xmlHttp.onreadystatechange = function () {
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp);
        };
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.send(null);
      }

      const session = this._session ?? null;
      httpGetAsync(asset.cdnBaseUrl + "/" + cdnUuid, (res) => {
        asset.decode(new Uint8Array(res.response), session);
      });
      return true;
    },
  });

  Module["FallbackFileAssetLoader"] = FileAssetLoader.extend(
    "FallbackFileAssetLoader",
    {
      "__construct": function () {
        this["__parent"]["__construct"].call(this);
        this.loaders = [];
      },
      "addLoader": function (loader) {
        this.loaders.push(loader);
      },
      "loadContents": function (assetAddress, bytes) {
        for (let loader of this.loaders) {
          if (loader.loadContents(assetAddress, bytes)) {
            return true;
          }
        }
        return false;
      },
    }
  );

  let computeAlignment = Module["computeAlignment"];
  Module["computeAlignment"] = function (
    fit,
    alignment,
    frame,
    content,
    scaleFactor = 1.0
  ) {
    return computeAlignment.call(
      this,
      fit,
      alignment,
      frame,
      content,
      scaleFactor
    );
  };
};
