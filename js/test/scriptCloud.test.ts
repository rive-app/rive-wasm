// The canvas build has no script networking, so setCloud only keeps its
// options and warns. The runtime's checks of them are in net_cloud_test.cpp.
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";

const cloudWarnings = (warn: jest.SpyInstance): unknown[][] =>
  warn.mock.calls.filter((args) =>
    String(args[0]).startsWith("[Rive] Rive Cloud"),
  );

describe("RuntimeLoader.setCloud without script networking", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    rive.RuntimeLoader.setCloud(null);
    rive.RuntimeLoader.setScriptFetch(false);
  });

  test("is off by default", () => {
    expect(rive.RuntimeLoader.getCloud()).toBeNull();
  });

  test("returns a copy of the options", () => {
    rive.RuntimeLoader.setCloud({
      url: "https://cloud.uat.rive.app",
      namespace: "ns_play",
    });
    const cloud = rive.RuntimeLoader.getCloud()!;
    expect(cloud).toEqual({
      url: "https://cloud.uat.rive.app",
      namespace: "ns_play",
    });
    cloud.namespace = "other";
    expect(rive.RuntimeLoader.getCloud()!.namespace).toBe("ns_play");
  });

  test("warns once, even after the script fetch warning", async () => {
    rive.RuntimeLoader.setScriptFetch(true);
    rive.RuntimeLoader.setCloud({ url: "https://cloud.rive.app", namespace: "ns" });
    await rive.RuntimeLoader.awaitInstance();
    rive.RuntimeLoader.setCloud({ url: "https://cloud.rive.app", namespace: "ns2" });
    expect(cloudWarnings(warn).length).toBe(1);
  });

  // After the test above: the warning is once per page.
  test("a file with its own cloud still loads where there is no Rive Cloud", async () => {
    const file = new rive.RiveFile({
      buffer: stateMachineFileBuffer,
      cloud: { url: "https://cloud.rive.app", namespace: "ns_ad" },
    });
    await file.init();
    expect(file.getInstance()).toBeTruthy();
    file.cleanup();
  });
});
