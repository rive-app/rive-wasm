// The runtime binds console when it loads, so lines are collected from the
// first one. Script logs reach the page as stdout, traps as stderr.
const lines: string[] = [];
(globalThis as any).riveConsoleLines = lines;
for (const level of ["log", "warn", "error"] as const) {
  console[level] = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
}
