// The canvas build has no script networking, so setRelay only keeps its
// options and warns. The runtime's checks of them are in net_cloud_test.cpp.
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";

const relayWarnings = (warn: jest.SpyInstance): unknown[][] =>
  warn.mock.calls.filter((args) =>
    String(args[0]).startsWith("[Rive] Rive Relay"),
  );

describe("RuntimeLoader.setRelay without script networking", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    rive.RuntimeLoader.setRelay(null);
    rive.RuntimeLoader.setScriptFetch(false);
  });

  test("is off by default", () => {
    expect(rive.RuntimeLoader.getRelay()).toBeNull();
  });

  test("returns a copy of the options", () => {
    rive.RuntimeLoader.setRelay({
      url: "https://relay.uat.rive.app",
      namespace: "ns_play",
    });
    const relay = rive.RuntimeLoader.getRelay()!;
    expect(relay).toEqual({
      url: "https://relay.uat.rive.app",
      namespace: "ns_play",
    });
    relay.namespace = "other";
    expect(rive.RuntimeLoader.getRelay()!.namespace).toBe("ns_play");
  });

  test("warns once, even after the script fetch warning", async () => {
    rive.RuntimeLoader.setScriptFetch(true);
    rive.RuntimeLoader.setRelay({ url: "https://relay.rive.app", namespace: "ns" });
    await rive.RuntimeLoader.awaitInstance();
    rive.RuntimeLoader.setRelay({ url: "https://relay.rive.app", namespace: "ns2" });
    expect(relayWarnings(warn).length).toBe(1);
  });

  // After the test above: the warning is once per page.
  test("a file with its own Relay namespace still loads where there is no Rive Relay", async () => {
    const file = new rive.RiveFile({
      buffer: stateMachineFileBuffer,
      relay: { url: "https://relay.rive.app", namespace: "ns_ad" },
    });
    await file.init();
    expect(file.getInstance()).toBeTruthy();
    file.cleanup();
  });
});
