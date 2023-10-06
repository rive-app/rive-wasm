// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { loadFile } from "./helpers";


test("Ensure onAsset called with hosted asset, contains cdn information.", async (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loadFile('assets/hosted_png_asset.riv'),
    autoplay: true,
    assetLoader: (asset, bytes) => {
      expect(bytes.length).toBe(0);
      
      expect(asset.name).toBe('some.png');
      expect(asset.cdnUuid).toBe('0b97b223-4bce-4502-8b07-51867a49d78d');
      expect(asset.fileExtension).toBe('png');
      expect(asset.isImage).toBe(true);
      expect(asset.isFont).toBe(false);
      done();
      return false;
    }
  });
});

test("Ensure onAsset called with embedded asset, contains bytes.", async (done) => {
  const mock =  jest.fn();
  window.URL.createObjectURL = mock;
  const canvas = document.createElement("canvas");
  await new Promise<void>((resolve) => {
    new rive.Rive({
      canvas: canvas,
      buffer: loadFile('assets/embedded_png_asset.riv'),
      autoplay: true,
      assetLoader: (asset, bytes) => {
        expect(bytes.length).toBe(308);
        expect(asset.name).toBe('1x1.png');
        expect(asset.cdnUuid).toBe('');
        expect(asset.fileExtension).toBe('png');
        expect(asset.isImage).toBe(true);
        expect(asset.isFont).toBe(false);
        
        resolve(); 
        return false;
      }
    }); 
  })

  // embedded assets do a fake request grabbing a blob
  // also, this might be suffer from race conditions, but the load 
  // should be initialized once a file is read
  expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
  expect(mock.mock.calls[0][0].size).toBe(308);
  
  done();
});

test("Ensure onAsset called with referenced asset, contains no cdn/byte information.", async (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loadFile('assets/referenced_png_asset.riv'),
    autoplay: true,
    assetLoader: (asset, bytes) => {
      expect(bytes.length).toBe(0);
      expect(asset.name).toBe('1x1.png');
      expect(asset.cdnUuid).toBe('');
      expect(asset.fileExtension).toBe('png');
      expect(asset.isImage).toBe(true);
      expect(asset.isFont).toBe(false);
      done();
      return false;
    }
  });
});

test("Ensure onAsset called with referenced asset, contains no cdn/byte information.", async (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loadFile('assets/referenced_font_asset.riv'),
    autoplay: true,
    assetLoader: (asset, bytes) => {
      expect(bytes.length).toBe(0);
      expect(asset.name).toBe('Inter');
      expect(asset.cdnUuid).toBe('');
      expect(asset.fileExtension).toBe('ttf');
      expect(asset.isImage).toBe(false);
      expect(asset.isFont).toBe(true);
      done();
      return false;
    }
  });
});