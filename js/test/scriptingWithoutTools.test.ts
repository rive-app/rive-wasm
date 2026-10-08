// This suite's build has no tools, unlike test/scripting's.
import fs from "fs";
import path from "path";
import * as rive from "../src/rive";

// The runtime binds console when it loads, so collect lines from the start.
const lines: string[] = [];
for (const level of ["log", "warn", "error"] as const) {
  console[level] = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
}

const fixture = (name: string): ArrayBuffer => {
  const bytes = fs.readFileSync(
    path.join(__dirname, "../../../runtime/tests/web_scripting/fixture", name),
  );
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
};

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

test("a module importing the raw shader op starts, and calling it traps", async () => {
  const canvas = document.createElement("canvas");
  const r = await new Promise<rive.Rive>((resolve, reject) => {
    const instance: rive.Rive = new rive.Rive({
      buffer: fixture("raw_shader.riv"),
      canvas,
      autoplay: true,
      onLoad: () => resolve(instance),
      onLoadError: (event: rive.Event) =>
        reject(new Error(String(event?.data ?? "load error"))),
    });
  });
  await frames(4);
  const logged = (text: string) => lines.some((line) => line.includes(text));
  expect(logged("init reaches the raw shader op")).toBe(true);
  expect(
    logged(
      "failed to call unlinked import function rive_gpu_v1.shader_module_new",
    ),
  ).toBe(true);
  expect(logged("raw shader op returned")).toBe(false);
  r.cleanup();
});
