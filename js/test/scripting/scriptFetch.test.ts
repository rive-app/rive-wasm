/**
 * @jest-environment-options {"url": "https://other.example.org/"}
 */
// Needs fixture/fetch.riv and fixture/stream.riv, baked from each one's
// main.as. The page is on the host the "other" probe fetches.
import * as path from "path";
import { MessageChannel as NodeMessageChannel } from "worker_threads";
import * as rive from "../../src/rive";
import { readFixture } from "../helpers";

const lines: string[] = (globalThis as any).riveConsoleLines;

const fixture = (name = "fetch"): ArrayBuffer =>
  readFixture(path.join(__dirname, `fixture/${name}.riv`));

const ascii = (text: string): ArrayBuffer =>
  new Uint8Array(Array.from(text, (c) => c.charCodeAt(0))).buffer;

// What the transport reads off a Response; jsdom has no Response.
const reply = (
  status: number,
  body = "",
  extra: { type?: string; headers?: Record<string, string> } = {},
) => {
  const headers = extra.headers ?? {};
  return {
    type: extra.type ?? "cors",
    status,
    statusText: "",
    url: "",
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
      forEach: (fn: (value: string, name: string) => void) =>
        Object.keys(headers).forEach((name) => fn(headers[name], name)),
    },
    body: null as null,
    arrayBuffer: async () => ascii(body),
  };
};

// A reply whose body streams in `chunks`, as browsers' responses do.
const streamed = (chunks: string[]) => {
  const cancel = jest.fn(() => Promise.resolve());
  let next = 0;
  return {
    cancel,
    response: {
      ...reply(200),
      body: {
        getReader: () => ({
          read: async () =>
            next < chunks.length
              ? { done: false, value: new Uint8Array(ascii(chunks[next++])) }
              : { done: true, value: undefined },
          cancel,
        }),
      },
    },
  };
};

type Call = { url: string; init: RequestInit };

const calls: Call[] = [];
const realFetch = (globalThis as any).fetch;

const stubFetch = () => {
  (globalThis as any).fetch = jest.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    switch (new URL(url).pathname) {
      case "/ok":
        return Promise.resolve(
          reply(200, "hello", { headers: { "content-type": "text/plain" } }),
        );
      case "/network":
        return Promise.reject(new TypeError("Failed to fetch"));
      case "/large":
        return Promise.resolve(reply(200, "x".repeat(1000)));
      case "/redirect":
        return Promise.resolve(reply(0, "", { type: "opaqueredirect" }));
      case "/hang":
        return new Promise(() => {});
      default:
        return Promise.resolve(reply(200, "unexpected"));
    }
  });
};

const instances: rive.Rive[] = [];

const play = (name = "fetch"): Promise<rive.Rive> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const r: rive.Rive = new rive.Rive({
      autoplay: true,
      buffer: fixture(name),
      canvas,
      onLoad: () => resolve(r),
      onLoadError: (event: rive.Event) =>
        reject(new Error(String(event?.data ?? "load error"))),
    });
    instances.push(r);
  });

const frames = (count: number): Promise<void> =>
  new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      if (--remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

const outcome = (name: string): string | undefined =>
  lines.find(
    (line) =>
      line.includes(`fetch ${name}: `) ||
      line.includes(`fetch ${name} failed: `) ||
      line.includes(`stream ${name}: `) ||
      line.includes(`stream ${name} failed: `),
  );

// Pumps frames until `done` holds or `ms` pass.
const waitFor = async (done: () => boolean, ms = 4000): Promise<void> => {
  const deadline = Date.now() + ms;
  while (!done() && Date.now() < deadline) {
    await frames(1);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

const cleanupNow = (r: rive.Rive) => {
  instances.splice(instances.indexOf(r), 1);
  r.cleanup();
};

// Waits until every named probe has logged.
const awaitOutcomes = async (...names: string[]): Promise<string[]> => {
  await waitFor(() => names.every(outcome));
  return names.map((name) => outcome(name) ?? `${name}: no outcome`);
};

const callTo = (pathname: string): Call | undefined =>
  calls.find((call) => new URL(call.url).pathname === pathname);

describe("script fetch()", () => {
  beforeEach(() => {
    lines.length = 0;
    calls.length = 0;
    stubFetch();
  });

  afterEach(() => {
    for (const r of instances.splice(0)) {
      r.cleanup();
    }
    rive.RuntimeLoader.setScriptFetch(false);
    (globalThis as any).fetch = realFetch;
  });

  test("is disabled by default", async () => {
    expect(rive.RuntimeLoader.getScriptFetch()).toBeNull();
    await play();
    const [ok] = await awaitOutcomes("ok");
    expect(ok).toContain("fetch ok failed: disabled:");
    expect(calls).toEqual([]);
  });

  test("delivers a response through the page's fetch()", async () => {
    rive.RuntimeLoader.setScriptFetch(true);
    await play();
    const [ok] = await awaitOutcomes("ok");
    expect(ok).toContain("fetch ok: 200 OK hello");
    const init = callTo("/ok")!.init;
    expect(init).toMatchObject({
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      redirect: "manual",
      referrerPolicy: "no-referrer",
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(lines.some((line) => line.includes("[Rive]"))).toBe(false);
  });

  test("maps transport failures to error codes", async () => {
    rive.RuntimeLoader.setScriptFetch({ maxResponseBytes: 64 });
    await play();
    const [network, large, redirect] = await awaitOutcomes(
      "network",
      "large",
      "redirect",
    );
    expect(network).toContain("fetch network failed: network:");
    expect(large).toContain("fetch large failed: tooLarge:");
    expect(redirect).toContain("fetch redirect failed: policy:");
  });

  test("rounds maxResponseBytes to whole bytes that fit", async () => {
    const runtime: any = await rive.RuntimeLoader.awaitInstance();
    const configure = jest.spyOn(runtime, "configureScriptFetch");
    const resolved = (maxResponseBytes: number): number => {
      configure.mockClear();
      rive.RuntimeLoader.setScriptFetch({ maxResponseBytes });
      return (configure.mock.calls[0][0] as any).maxResponseBytes;
    };
    try {
      expect(resolved(256 * 1024 * 1024)).toBe(256 * 1024 * 1024);
      expect(resolved(71.7 * 1024 * 1024)).toBe(75182899);
      expect(resolved(0.5)).toBe(1);
      expect(resolved(2 ** 32)).toBe(0xffffffff);
      expect(resolved(-1)).toBe(0);
      expect(resolved(NaN)).toBe(0);
    } finally {
      configure.mockRestore();
    }
  });

  test("reads streamed bodies and enforces the limit across chunks", async () => {
    const ok = streamed(["hel", "lo"]);
    const large = streamed(["x".repeat(40), "x".repeat(40), "x".repeat(40)]);
    const stub = (globalThis as any).fetch;
    (globalThis as any).fetch = jest.fn((url: string, init: RequestInit) => {
      const pathname = new URL(url).pathname;
      if (pathname === "/ok") {
        return Promise.resolve(ok.response);
      }
      if (pathname === "/large") {
        return Promise.resolve(large.response);
      }
      return stub(url, init);
    });
    rive.RuntimeLoader.setScriptFetch({ maxResponseBytes: 64 });
    await play();
    const [okLine, largeLine] = await awaitOutcomes("ok", "large");
    expect(okLine).toContain("fetch ok: 200 OK hello");
    expect(largeLine).toContain("fetch large failed: tooLarge:");
    expect(ok.cancel).not.toHaveBeenCalled();
    expect(large.cancel).toHaveBeenCalled();
  });

  test("the runtime refuses http: before the page sees it", async () => {
    rive.RuntimeLoader.setScriptFetch(true);
    await play();
    const [insecure] = await awaitOutcomes("insecure");
    expect(insecure).toContain("fetch insecure failed: policy:");
    expect(calls.some((call) => call.url.startsWith("http:"))).toBe(false);
  });

  test("refuses this page's own host unless allowedHosts names it", async () => {
    rive.RuntimeLoader.setScriptFetch(true);
    await play();
    const [ok, other] = await awaitOutcomes("ok", "other");
    expect(ok).toContain("fetch ok: 200 OK hello");
    expect(other).toContain("fetch other failed: policy:");
    expect(callTo("/other")).toBeUndefined();
  });

  test('"*" with the page\'s host named allows both', async () => {
    rive.RuntimeLoader.setScriptFetch({
      allowedHosts: ["*", "other.example.org"],
    });
    await play();
    const [ok, other] = await awaitOutcomes("ok", "other");
    expect(ok).toContain("fetch ok: 200 OK hello");
    expect(other).toContain("fetch other: 200 OK unexpected");
  });

  test("an empty allowedHosts allows no host", async () => {
    rive.RuntimeLoader.setScriptFetch({ allowedHosts: [] });
    await play();
    const [ok] = await awaitOutcomes("ok");
    expect(ok).toContain("fetch ok failed: policy:");
    expect(calls).toEqual([]);
  });

  test('"*." and "*.." in allowedHosts allow no host', async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    rive.RuntimeLoader.setScriptFetch({ allowedHosts: ["*.", "*.."] });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
    await play();
    const [ok, other] = await awaitOutcomes("ok", "other");
    expect(ok).toContain("fetch ok failed: policy:");
    expect(other).toContain("fetch other failed: policy:");
    expect(calls).toEqual([]);
  });

  test("an allowedHosts entry holding a NUL allows no host", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    rive.RuntimeLoader.setScriptFetch({
      allowedHosts: ["api.example.com\u0000*"],
    });
    warn.mockRestore();
    await play();
    const [ok, other] = await awaitOutcomes("ok", "other");
    expect(ok).toContain("fetch ok failed: policy:");
    expect(other).toContain("fetch other failed: policy:");
    expect(calls).toEqual([]);
  });

  test("an allowedHosts that isn't an array allows no host", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    rive.RuntimeLoader.setScriptFetch({
      allowedHosts: "api.example.com" as unknown as string[],
    });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
    expect(rive.RuntimeLoader.getScriptFetch()!.allowedHosts).toEqual([]);
    await play();
    const [ok] = await awaitOutcomes("ok");
    expect(ok).toContain("fetch ok failed: policy:");
    expect(calls).toEqual([]);
  });

  test("warns about a proxyUrl on the page's own origin", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    rive.RuntimeLoader.setScriptFetch({
      proxyUrl: "https://proxy.example.net/fetch.html",
    });
    expect(warn).not.toHaveBeenCalled();
    rive.RuntimeLoader.setScriptFetch({ proxyUrl: "/fetch-proxy/" });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test("warns about allowedHosts entries that can't work", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    rive.RuntimeLoader.setScriptFetch({
      allowedHosts: [
        "*",
        "api.example.com",
        "*.example.com",
        "*.com",
        "https://api.example.com",
      ],
    });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  test("allowedHosts refuses other hosts", async () => {
    rive.RuntimeLoader.setScriptFetch({ allowedHosts: ["api.example.com"] });
    await play();
    const [ok, other] = await awaitOutcomes("ok", "other");
    expect(ok).toContain("fetch ok: 200 OK hello");
    expect(other).toContain("fetch other failed: policy:");
    expect(callTo("/other")).toBeUndefined();
  });

  test("allowedHosts matches regardless of case or a trailing dot", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    rive.RuntimeLoader.setScriptFetch({ allowedHosts: ["API.Example.com."] });
    await play();
    const [ok] = await awaitOutcomes("ok");
    expect(ok).toContain("fetch ok: 200 OK hello");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  test("cleanup aborts requests in flight", async () => {
    rive.RuntimeLoader.setScriptFetch(true);
    const r = await play();
    await awaitOutcomes("ok");
    const signal = callTo("/hang")!.init.signal!;
    expect(signal.aborted).toBe(false);
    cleanupNow(r);
    await waitFor(() => signal.aborted, 2000);
    expect(signal.aborted).toBe(true);
    expect(outcome("hang")).toBeUndefined();
  });

  describe("with a body read as it arrives", () => {
    const kRun = 1 << 20;

    // A reply whose body is `count` runs of a megabyte, counting those read.
    const megabytes = (count: number) => {
      const state = { reads: 0, cancelled: false };
      const run = new Uint8Array(kRun);
      const response = {
        ...reply(200),
        body: {
          getReader: () => ({
            read: async () =>
              state.reads < count && !state.cancelled
                ? { done: false, value: (state.reads++, run) }
                : { done: true, value: undefined },
            cancel: async () => {
              state.cancelled = true;
            },
          }),
        },
      };
      return { state, response };
    };

    // The stream fixture's three requests, answered by path.
    const answer = (replies: Record<string, unknown>) => {
      (globalThis as any).fetch = jest.fn((url: string) =>
        Promise.resolve(replies[new URL(url).pathname] ?? reply(200)),
      );
    };

    test("a script reads a body a run at a time or whole", async () => {
      answer({
        "/runs": streamed(["ab", "cde"]).response,
        "/whole": streamed(["hel", "lo"]).response,
      });
      rive.RuntimeLoader.setScriptFetch(true);
      await play("stream");
      const [runs, whole, hold] = await awaitOutcomes("runs", "whole", "hold");
      expect(runs).toContain("stream runs: 5 bytes");
      expect(whole).toContain("stream whole: hello");
      expect(hold).toContain("stream hold: 200");
    });

    test("only a body read whole is held to the size limit", async () => {
      answer({
        "/runs": streamed(["ab", "cde"]).response,
        "/whole": streamed(["hel", "lo"]).response,
      });
      rive.RuntimeLoader.setScriptFetch({ maxResponseBytes: 4 });
      await play("stream");
      const [runs, whole] = await awaitOutcomes("runs", "whole");
      expect(runs).toContain("stream runs: 5 bytes");
      expect(whole).toContain("stream whole failed: tooLarge:");
    });

    test("a body past 64 MiB arrives in runs and whole", async () => {
      answer({
        "/runs": megabytes(72).response,
        "/blob": megabytes(70).response,
      });
      rive.RuntimeLoader.setScriptFetch({
        maxResponseBytes: 128 * 1024 * 1024,
      });
      await play("stream");
      await waitFor(() => !!outcome("runs") && !!outcome("blob"), 30000);
      expect(outcome("runs")).toContain(`stream runs: ${72 * kRun} bytes`);
      expect(outcome("blob")).toContain(`stream blob: ${70 * kRun} bytes`);
    }, 60000);

    test("a body is read no faster than its script takes it", async () => {
      const read = megabytes(24);
      // Finite, so a body that is never stopped fails this instead of
      // running on.
      const unread = megabytes(64);
      answer({ "/runs": read.response, "/hold": unread.response });
      rive.RuntimeLoader.setScriptFetch(true);
      await play("stream");
      const [runs] = await awaitOutcomes("runs");
      // Past the megabytes that wait unread at once, so the transport was
      // stopped and started again.
      expect(runs).toContain(`stream runs: ${24 * kRun} bytes`);
      // Nothing takes the other body, so reading it stops.
      await frames(20);
      const settled = unread.state.reads;
      await frames(20);
      expect(unread.state.reads).toBe(settled);
      expect(settled).toBeGreaterThanOrEqual(8);
      expect(settled).toBeLessThan(12);
    });

    test("cleanup stops a body still arriving", async () => {
      const unread = megabytes(64);
      answer({ "/hold": unread.response });
      rive.RuntimeLoader.setScriptFetch(true);
      const r = await play("stream");
      await awaitOutcomes("hold");
      await frames(10);
      cleanupNow(r);
      await frames(5);
      expect(unread.state.cancelled).toBe(true);
    });
  });

  describe("through a proxy", () => {
    const proxyUrl = "https://proxy.example.net/fetch.html";
    // jsdom has no MessageChannel; the transport uses the global one.
    const pageMessageChannel = (globalThis as any).MessageChannel;

    // What the transport posted to the proxy page's window, and every
    // message it then sent on the port it offered.
    type Connect = { data: unknown; origin: string; port: MessagePort };
    let connects: Connect[];
    let received: any[];
    // Fields to replace in the response to a path.
    let overrides: Record<string, object>;
    // Bodies sent a run per read when a request asks to stream, by path.
    let streams: Record<string, Uint8Array[]>;
    // Each streamed request's runs still to send, and how many were read.
    let streaming: Map<number, { runs: Uint8Array[]; reads: number }>;

    // Answers like the proxy page, by the path fetched; /hang never settles.
    const answer = (port: MessagePort, data: any) => {
      if (data.type === "read") {
        const body = streaming.get(data.id);
        if (!body) {
          return;
        }
        const run = body.runs.shift();
        if (run) {
          body.reads++;
          port.postMessage({ type: "body", id: data.id, body: run.slice().buffer });
        } else {
          streaming.delete(data.id);
          port.postMessage({ type: "end", id: data.id });
        }
        return;
      }
      if (data.type === "abort") {
        streaming.delete(data.id);
        return;
      }
      if (data.type !== "fetch") {
        return;
      }
      const { id, url } = data;
      const pathname = new URL(url).pathname;
      if (data.stream && streams[pathname]) {
        streaming.set(id, { runs: [...streams[pathname]], reads: 0 });
        port.postMessage({
          type: "response",
          id,
          status: 200,
          statusText: "OK",
          url,
          headers: [],
        });
      } else if (pathname === "/network") {
        port.postMessage({ type: "error", id, code: "network", message: "x" });
      } else if (pathname === "/redirect") {
        // A proxy page that followed a redirect to another public host.
        port.postMessage({
          type: "response",
          id,
          status: 200,
          statusText: "OK",
          url: "https://elsewhere.example.org/landed",
          headers: [],
          body: ascii("followed"),
        });
      } else if (pathname !== "/hang") {
        port.postMessage({
          type: "response",
          id,
          status: 200,
          statusText: "OK",
          url,
          headers: [["content-type", "text/plain"]],
          body: ascii(
            pathname === "/ok"
              ? "hello"
              : pathname === "/large"
                ? "x".repeat(1000)
                : "unexpected",
          ),
          ...overrides[pathname],
        });
      }
    };

    beforeAll(() => {
      (globalThis as any).MessageChannel = NodeMessageChannel;
    });

    afterAll(() => {
      (globalThis as any).MessageChannel = pageMessageChannel;
    });

    beforeEach(() => {
      connects = [];
      received = [];
      overrides = {};
      streams = {};
      streaming = new Map();
      jest
        .spyOn(HTMLIFrameElement.prototype, "contentWindow", "get")
        .mockReturnValue({
          postMessage: (data: unknown, origin: string, ports: MessagePort[]) => {
            const port = ports[0];
            port.onmessage = (event: MessageEvent) => {
              received.push(event.data);
              answer(port, event.data);
            };
            connects.push({ data, origin, port });
          },
        } as unknown as Window);
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
      for (const { port } of connects) {
        port.close();
      }
    });

    const proxyFrame = async (): Promise<HTMLIFrameElement> => {
      await waitFor(() => !!document.querySelector("iframe"));
      return document.querySelector("iframe")!;
    };

    // jsdom loads nothing, so the test fires the proxy page's load.
    const loadProxy = async (): Promise<HTMLIFrameElement> => {
      const frame = await proxyFrame();
      frame.dispatchEvent(new Event("load"));
      return frame;
    };

    const ready = () =>
      connects[connects.length - 1].port.postMessage({ type: "ready" });

    const sent = (type: string, pathname?: string) =>
      received.filter(
        (message) =>
          message.type === type &&
          (!pathname || new URL(message.url).pathname === pathname),
      );

    test("delivers a response through the proxy page", async () => {
      rive.RuntimeLoader.setScriptFetch({ proxyUrl });
      await play();
      const frame = await loadProxy();
      expect(frame.getAttribute("src")).toBe(proxyUrl);
      expect(frame.getAttribute("sandbox")).toBe(
        "allow-scripts allow-same-origin",
      );
      expect(connects).toHaveLength(1);
      expect(connects[0].data).toEqual({
        rive: "script-fetch-proxy",
        type: "connect",
        version: 1,
      });
      expect(connects[0].origin).toBe("https://proxy.example.net");
      expect(received).toEqual([]);

      ready();
      const [ok, network] = await awaitOutcomes("ok", "network");
      expect(ok).toContain("fetch ok: 200 OK hello");
      expect(network).toContain("fetch network failed: network:");
      const [request] = sent("fetch", "/ok");
      expect(request).toMatchObject({
        url: "https://api.example.com/ok",
        method: "GET",
        body: null,
      });
      expect(typeof request.id).toBe("number");
      expect(request.timeoutMs).toBeGreaterThan(0);
      expect(request.maxBodyBytes).toBeGreaterThan(0);
      expect(calls).toEqual([]);
    });

    test("allowedHosts refuses a redirect the proxy followed", async () => {
      rive.RuntimeLoader.setScriptFetch({
        proxyUrl,
        allowedHosts: ["api.example.com"],
      });
      await play();
      await loadProxy();
      ready();
      const [ok, redirect] = await awaitOutcomes("ok", "redirect");
      expect(ok).toContain("fetch ok: 200 OK hello");
      expect(redirect).toContain("fetch redirect failed: policy:");
    });

    test("enforces the body limit", async () => {
      rive.RuntimeLoader.setScriptFetch({ proxyUrl, maxResponseBytes: 64 });
      await play();
      await loadProxy();
      ready();
      const [ok, large] = await awaitOutcomes("ok", "large");
      expect(ok).toContain("fetch ok: 200 OK hello");
      expect(large).toContain("fetch large failed: tooLarge:");
    });

    test("carries the largest maxResponseBytes to the transport", async () => {
      rive.RuntimeLoader.setScriptFetch({
        proxyUrl,
        maxResponseBytes: Infinity,
      });
      await play();
      await loadProxy();
      ready();
      const [ok] = await awaitOutcomes("ok");
      expect(ok).toContain("fetch ok: 200 OK hello");
      expect(sent("fetch", "/ok")[0].maxBodyBytes).toBe(0xffffffff);
    });

    test("refuses malformed responses", async () => {
      overrides = {
        "/ok": { url: undefined },
        "/large": { headers: [["x-a\0b", "c"]] },
        "/other": { body: 2e9 },
      };
      rive.RuntimeLoader.setScriptFetch({
        proxyUrl,
        allowedHosts: ["*", "other.example.org"],
      });
      await play();
      await loadProxy();
      ready();
      const [ok, large, other] = await awaitOutcomes("ok", "large", "other");
      expect(ok).toContain("fetch ok failed: network:");
      expect(large).toContain("fetch large failed: network:");
      expect(other).toContain("fetch other failed: network:");
    });

    test("refuses invalid statuses and oversized header lists", async () => {
      overrides = {
        "/ok": { status: 0 },
        "/large": { headers: new Array(200_000).fill(["", ""]) },
        "/other": { status: BigInt(200) },
      };
      rive.RuntimeLoader.setScriptFetch({
        proxyUrl,
        allowedHosts: ["*", "other.example.org"],
      });
      await play();
      await loadProxy();
      ready();
      const [ok, large, other] = await awaitOutcomes("ok", "large", "other");
      expect(ok).toContain("fetch ok failed: network:");
      expect(large).toContain("fetch large failed: network:");
      expect(other).toContain("fetch other failed: network:");
    });

    test("refuses a statusText with NULs", async () => {
      // Would shift the fields wasm reads and swap in an unchecked URL.
      overrides = {
        "/ok": { statusText: "OK\0https://elsewhere.example.org/\0x" },
      };
      rive.RuntimeLoader.setScriptFetch({ proxyUrl });
      await play();
      await loadProxy();
      ready();
      const [ok] = await awaitOutcomes("ok");
      expect(ok).toContain("fetch ok failed: network:");
    });

    test("refuses response headers over the size limit", async () => {
      overrides = { "/ok": { headers: [["x-big", "y".repeat(300 * 1024)]] } };
      rive.RuntimeLoader.setScriptFetch({ proxyUrl });
      await play();
      await loadProxy();
      ready();
      const [ok] = await awaitOutcomes("ok");
      expect(ok).toContain("fetch ok failed: network:");
    });

    test("fails requests with network when the handshake times out", async () => {
      jest.useFakeTimers({
        doNotFake: [
          "Date",
          "performance",
          "requestAnimationFrame",
          "cancelAnimationFrame",
          "nextTick",
          "setImmediate",
          "queueMicrotask",
        ],
      });
      rive.RuntimeLoader.setScriptFetch({ proxyUrl });
      await play();
      await loadProxy();
      expect(connects).toHaveLength(1);
      await frames(2);
      expect(outcome("ok")).toBeUndefined();

      jest.advanceTimersByTime(10000);
      jest.useRealTimers();
      const [ok, hang] = await awaitOutcomes("ok", "hang");
      expect(ok).toContain("fetch ok failed: network:");
      expect(ok).toContain("did not answer");
      expect(hang).toContain("fetch hang failed: network:");
      expect(document.querySelector("iframe")).toBeNull();
      expect(received).toEqual([]);
    });

    test("a proxy page that reloads fails the requests it had", async () => {
      rive.RuntimeLoader.setScriptFetch({ proxyUrl });
      await play();
      const frame = await loadProxy();
      ready();
      await awaitOutcomes("ok");
      expect(sent("fetch", "/hang")).toHaveLength(1);

      jest.useFakeTimers({
        doNotFake: [
          "Date",
          "performance",
          "requestAnimationFrame",
          "cancelAnimationFrame",
          "nextTick",
          "setImmediate",
          "queueMicrotask",
        ],
      });
      frame.dispatchEvent(new Event("load"));
      expect(connects).toHaveLength(2);
      jest.advanceTimersByTime(10000);
      jest.useRealTimers();
      const [hang] = await awaitOutcomes("hang");
      expect(hang).toContain("fetch hang failed: network:");
      expect(hang).toContain("reloaded");
      // The reloaded page never answered either.
      expect(document.querySelector("iframe")).toBeNull();
    });

    test("cleanup before the handshake withdraws queued requests", async () => {
      rive.RuntimeLoader.setScriptFetch({ proxyUrl });
      const first = await play();
      await proxyFrame();
      cleanupNow(first);

      // A second instance's requests are the only ones the proxy should get.
      await play();
      await loadProxy();
      ready();
      await awaitOutcomes("ok");
      expect(sent("fetch", "/hang")).toHaveLength(1);
      expect(sent("fetch", "/ok")).toHaveLength(1);
      expect(sent("abort")).toEqual([]);
    });

    test("cleanup after the handshake posts abort to the proxy", async () => {
      rive.RuntimeLoader.setScriptFetch({ proxyUrl });
      const r = await play();
      await loadProxy();
      ready();
      await awaitOutcomes("ok");
      const [hang] = sent("fetch", "/hang");
      expect(sent("abort")).toEqual([]);

      cleanupNow(r);
      await waitFor(() => sent("abort").length > 0, 2000);
      expect(sent("abort")).toEqual([{ type: "abort", id: hang.id }]);
      expect(outcome("hang")).toBeUndefined();
    });

    test("a relative proxyUrl resolves against the page's <base>", async () => {
      const base = document.createElement("base");
      base.href = "https://static.example.net/";
      document.head.appendChild(base);
      try {
        rive.RuntimeLoader.setScriptFetch({ proxyUrl: "/fetch-proxy/" });
        await play();
        const frame = await loadProxy();
        expect(frame.getAttribute("src")).toBe(
          "https://static.example.net/fetch-proxy/",
        );
        expect(connects[0].origin).toBe("https://static.example.net");
      } finally {
        base.remove();
      }
    });

    describe("that streams", () => {
      const text = (value: string) => new Uint8Array(ascii(value));
      const megabytes = (count: number) =>
        new Array(count).fill(new Uint8Array(1 << 20));

      test("sends a body a run per read", async () => {
        streams = {
          "/runs": [text("ab"), text("cde")],
          "/whole": [text("hel"), text("lo")],
          "/hold": [text("x")],
        };
        rive.RuntimeLoader.setScriptFetch({ proxyUrl, maxResponseBytes: 4 });
        await play("stream");
        await loadProxy();
        ready();
        const [runs, whole, hold] = await awaitOutcomes("runs", "whole", "hold");
        expect(runs).toContain("stream runs: 5 bytes");
        // Only a body read whole is held to the size limit.
        expect(whole).toContain("stream whole failed: tooLarge:");
        expect(hold).toContain("stream hold: 200");
        expect(sent("fetch", "/runs")[0].stream).toBe(true);
        expect(sent("read").length).toBeGreaterThanOrEqual(3);
      });

      test("asks for no more than its script takes", async () => {
        streams = { "/runs": megabytes(72), "/hold": megabytes(64) };
        rive.RuntimeLoader.setScriptFetch({ proxyUrl });
        await play("stream");
        await loadProxy();
        ready();
        await waitFor(() => !!outcome("runs"), 30000);
        expect(outcome("runs")).toContain(`stream runs: ${72 << 20} bytes`);
        const [hold] = sent("fetch", "/hold");
        await frames(20);
        const settled = streaming.get(hold.id)!.reads;
        await frames(20);
        expect(streaming.get(hold.id)!.reads).toBe(settled);
        expect(settled).toBeGreaterThanOrEqual(8);
        expect(settled).toBeLessThan(12);
      }, 60000);

      test("a proxy that answers whole still serves a reader", async () => {
        overrides = { "/runs": { body: ascii("abcde") } };
        rive.RuntimeLoader.setScriptFetch({ proxyUrl });
        await play("stream");
        await loadProxy();
        ready();
        const [runs] = await awaitOutcomes("runs");
        expect(runs).toContain("stream runs: 5 bytes");
        expect(sent("read")).toEqual([]);
      });

      test("cleanup stops a body still arriving", async () => {
        streams = { "/hold": megabytes(64) };
        rive.RuntimeLoader.setScriptFetch({ proxyUrl });
        const r = await play("stream");
        await loadProxy();
        ready();
        await awaitOutcomes("hold");
        const [hold] = sent("fetch", "/hold");
        cleanupNow(r);
        await waitFor(() => sent("abort").length > 0, 2000);
        expect(sent("abort")).toContainEqual({ type: "abort", id: hold.id });
      });

      test("refuses a run that isn't an ArrayBuffer", async () => {
        streams = { "/runs": [text("ab")] };
        rive.RuntimeLoader.setScriptFetch({ proxyUrl });
        await play("stream");
        await loadProxy();
        const port = connects[0].port;
        const reply = port.onmessage!;
        port.onmessage = (event: MessageEvent) => {
          if (event.data.type === "read") {
            received.push(event.data);
            port.postMessage({ type: "body", id: event.data.id, body: "ab" });
            return;
          }
          reply.call(port, event);
        };
        ready();
        const [runs] = await awaitOutcomes("runs");
        expect(runs).toContain("stream runs failed: network:");
        const [request] = sent("fetch", "/runs");
        await waitFor(() => sent("abort").length > 0, 2000);
        expect(sent("abort")).toContainEqual({ type: "abort", id: request.id });
      });
    });

    test("a malformed proxyUrl fails requests instead of throwing", async () => {
      rive.RuntimeLoader.setScriptFetch({ proxyUrl: "https://[" });
      await play();
      const [ok, hang] = await awaitOutcomes("ok", "hang");
      expect(ok).toContain("fetch ok failed: network:");
      expect(ok).toContain("could not be loaded");
      expect(hang).toContain("fetch hang failed: network:");
      expect(document.querySelector("iframe")).toBeNull();
      expect(connects).toEqual([]);
      expect(calls).toEqual([]);
    });
  });
});
