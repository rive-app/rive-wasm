import type { RiveCanvas } from "../src/rive_advanced.mjs";

type Finalizable = { unref(): void };

class TestFinalizationRegistry {
  static instances: TestFinalizationRegistry[] = [];
  registrations = new Map<object, { value: Finalizable; token?: object }>();

  constructor(private callback: (value: Finalizable) => void) {
    TestFinalizationRegistry.instances.push(this);
  }

  register(target: object, value: Finalizable, token?: object) {
    this.registrations.set(target, { value, token });
  }

  unregister(token: object) {
    for (const [target, registration] of this.registrations) {
      if (registration.token === token) {
        return this.registrations.delete(target);
      }
    }
    return false;
  }

  collect(target: object) {
    const registration = this.registrations.get(target);
    if (registration) {
      this.registrations.delete(target);
      this.callback(registration.value);
    }
  }
}

describe("decoded image ownership", () => {
  const originalRegistry = Object.getOwnPropertyDescriptor(
    globalThis,
    "FinalizationRegistry",
  );

  beforeEach(() => {
    TestFinalizationRegistry.instances = [];
    Object.defineProperty(globalThis, "FinalizationRegistry", {
      configurable: true,
      value: TestFinalizationRegistry,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalRegistry) {
      Object.defineProperty(
        globalThis,
        "FinalizationRegistry",
        originalRegistry,
      );
    } else {
      Reflect.deleteProperty(globalThis, "FinalizationRegistry");
    }
  });

  async function decodeImage() {
    let api: typeof import("../src/rive");
    jest.isolateModules(() => {
      api = require("../src/rive");
    });
    const nativeImage = { unref: jest.fn() };
    const runtime = {
      decodeImage: (
        _bytes: Uint8Array,
        resolve: (image: Finalizable) => void,
      ) => resolve(nativeImage),
    } as RiveCanvas;
    jest
      .spyOn(api.RuntimeLoader, "getInstance")
      .mockImplementation((callback) => {
        callback(runtime);
        return runtime;
      });
    const image = await api.decodeImage(new Uint8Array());
    return {
      image,
      nativeImage,
      registry: TestFinalizationRegistry.instances[0],
    };
  }

  test("unref releases the native reference before garbage collection", async () => {
    const { image, nativeImage, registry } = await decodeImage();

    image.unref();

    expect(nativeImage.unref).toHaveBeenCalledTimes(1);
    expect(registry.registrations.size).toBe(0);
  });

  test("repeated unref and later collection cannot release the reference twice", async () => {
    const { image, nativeImage, registry } = await decodeImage();

    image.unref();
    image.unref();
    expect(nativeImage.unref).toHaveBeenCalledTimes(1);
    registry.collect(image);

    expect(nativeImage.unref).toHaveBeenCalledTimes(1);
  });

  test("garbage collection still releases images without an explicit unref", async () => {
    const { image, nativeImage, registry } = await decodeImage();

    expect(nativeImage.unref).not.toHaveBeenCalled();
    registry.collect(image);

    expect(nativeImage.unref).toHaveBeenCalledTimes(1);
  });

  test("unref releases exactly once without FinalizationRegistry", async () => {
    Object.defineProperty(globalThis, "FinalizationRegistry", {
      value: undefined,
    });
    const { image, nativeImage } = await decodeImage();

    image.unref();
    image.unref();

    expect(nativeImage.unref).toHaveBeenCalledTimes(1);
  });
});
