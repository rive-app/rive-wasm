// The web transport sends a rive-cloud: request as the engine's wrapped form
// (cloud_engine/include/cloud_engine/wrapped_request.hpp), a POST with a
// text/plain body a browser sends without a CORS preflight. Runs
// wasm/js/script_fetch.js on its own, with a stub fetch and none of the wasm.
import * as fs from "fs";
import * as path from "path";
import { TextDecoder, TextEncoder } from "util";

type Sent = { url: string; init: RequestInit };

function loadTransport() {
  const sent: Sent[] = [];
  // The failures reported to the runtime, as "code: message".
  const failures: string[] = [];
  // The heap, as the strings copied into it.
  const heap = new Map<number, string>();
  let nextPtr = 8;
  const Module: Record<string, any> = {
    _riveScriptFetchFail: (
      _id: number,
      code: number,
      _codeLength: number,
      message: number,
    ) => failures.push(heap.get(code) + ": " + heap.get(message)),
  };
  const source = fs.readFileSync(
    path.join(__dirname, "../../wasm/js/script_fetch.js"),
    "utf8",
  );
  const fetchStub = (url: string, init: RequestInit) => {
    sent.push({ url, init });
    // Never answers: the tests read what was sent.
    return new Promise(() => {});
  };
  // The device key is made on the first cloud request; it is not wanted here.
  const indexedDB = { open: () => ({}) };
  new Function(
    "Module",
    "fetch",
    "indexedDB",
    "lengthBytesUTF8",
    "stringToUTF8",
    "_malloc",
    "_free",
    "TextDecoder",
    source,
  )(
    Module,
    fetchStub,
    indexedDB,
    (text: string) => text.length,
    (text: string, ptr: number) => heap.set(ptr, text),
    () => (nextPtr += 8),
    (ptr: number) => heap.delete(ptr),
    TextDecoder,
  );
  let next = 1;
  const start = (
    method: string,
    headers: [string, string][],
    body: string | null,
  ) =>
    Module.scriptFetch.start(
      next++,
      "https://cloud.example/v1/ns/ns1/players/me/data/k",
      method,
      headers,
      body === null ? null : new TextEncoder().encode(body).buffer,
      10000,
      1 << 20,
      true,
    );
  // Ends every request, and with it its timeout.
  const stop = () => {
    for (let id = 1; id < next; id++) Module.scriptFetch.abort(id);
  };
  return { start, stop, sent, failures };
}

describe("a rive-cloud: request on the web", () => {
  let t: ReturnType<typeof loadTransport>;
  beforeEach(() => {
    t = loadTransport();
  });
  afterEach(() => t.stop());

  test("is a text/plain POST to the same URL, carrying its method, token and key", () => {
    t.start(
      "PUT",
      [
        ["Authorization", "Bearer tok.1"],
        ["Idempotency-Key", "run.1.7"],
        ["Content-Type", "application/json"],
      ],
      '{"value":{"best":9007199254740993}}',
    );
    expect(t.sent.length).toBe(1);
    const { url, init } = t.sent[0];
    expect(url).toBe("https://cloud.example/v1/ns/ns1/players/me/data/k");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual([["content-type", "text/plain;charset=UTF-8"]]);
    expect(init.credentials).toBe("omit");
    // The body is sent as it was, so an integer past 2^53 keeps its digits.
    expect(init.body).toBe(
      '{"method":"PUT","token":"tok.1","idempotencyKey":"run.1.7",' +
        '"body":{"value":{"best":9007199254740993}}}',
    );
  });

  test("a hello has no token, and a GET or DELETE no body", () => {
    t.start("POST", [], null);
    t.start("GET", [["Authorization", "Bearer tok.2"]], null);
    // The engine ignores a plain DELETE's body, and refuses a wrapped one's.
    t.start("DELETE", [["Authorization", "Bearer tok.2"]], "{}");
    expect(t.sent.map((s) => s.init.body)).toEqual([
      '{"method":"POST"}',
      '{"method":"GET","token":"tok.2"}',
      '{"method":"DELETE","token":"tok.2"}',
    ]);
  });

  test("the first of two Idempotency-Keys is the one sent, as the engine reads a plain request", () => {
    t.start(
      "PUT",
      [
        ["Idempotency-Key", "first"],
        ["idempotency-key", "second"],
      ],
      "{}",
    );
    expect(t.sent[0].init.body).toBe(
      '{"method":"PUT","idempotencyKey":"first","body":{}}',
    );
  });

  test("a body that is not JSON is refused before anything is sent", async () => {
    t.start("PUT", [], "not json");
    // sendDirect fails it once it runs.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(t.sent).toEqual([]);
    expect(t.failures).toEqual(["policy: a rive-cloud: body is JSON"]);
  });
});
