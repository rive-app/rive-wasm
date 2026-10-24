#!/usr/bin/env python3
"""finalize_glue.py [--threads] <glue.mjs> [...]

With the bump from Emsdk 3.x to 4.x, the JS glue has some breaking changes
we need to account for to prevent a breaking change in the module format and
how some developers use the various JS runtime libs. This script is run on
the glue .mjs files after they're built by emcc.

This converts emcc's --oformat=js output into the module format we publish: an ES
module with `export default Rive;` and document.currentScript-based script
location, no import.meta. Strips the UMD tail and appends the export.

The UMD tail cannot be kept alongside the export

--threads takes a pthread build, whose glue ends in a pthread autostart after
the UMD tail. Its module wraps the glue in a function and exports a factory
that starts the pthread workers from that function's own source, so a worker
needs no script URL, which a page loading rive.js from a CDN could not give it.

Exits nonzero if the emcc output shape drifts. Safe to re-run.
"""
import re
import sys

UMD_TAIL = re.compile(
    r"""\s*
        if\s*\(\s*typeof\s+exports\s*===?\s*["']object["']\s*&&\s*
            typeof\s+module\s*===?\s*["']object["']\s*\)\s*
        \{\s*module\.exports\s*=\s*Rive\s*;\s*
            module\.exports\.default\s*=\s*Rive\s*;?\s*\}\s*
        else\s+if\s*\(\s*typeof\s+define\s*===?\s*["']function["']\s*&&\s*
            define\s*\[\s*["']amd["']\s*\]\s*\)\s*
        define\s*\(\s*\[\s*\]\s*,\s*\(\s*\)\s*=>\s*Rive\s*\)\s*;?\s*
        $""",
    re.VERBOSE,
)

# What --threads expects after the UMD tail: a worker named em-pthread starts
# the module itself.
PTHREAD_TAIL = re.compile(
    r"""\s*
        var\s+isPthread\s*=\s*
            globalThis\.self\?\.name\?\.startsWith\(\s*["']em-pthread["']\s*\)\s*;\s*
        isPthread\s*&&\s*Rive\s*\(\s*\)\s*;?\s*
        $""",
    re.VERBOSE,
)

THREADS_EXPORT = """
let riveWorker;
export default (moduleArg = {}) =>
  Rive({
    mainScriptUrlOrBlob: (riveWorker ??= new Blob(["(" + riveGlue + ")()"], {
      type: "text/javascript",
    })),
    ...moduleArg,
  });
"""


def mask_line_comments(src: str) -> str:
    """Blank out whole-line // comments, preserving every offset.

    Release builds run --closure 1 and carry no comments, but debug builds keep
    emcc's. Those comments mention import.meta and sit between the two
    module.exports assignments, so matching against the raw source would reject
    output that is in fact the shape we want.
    """
    return "\n".join(
        " " * len(line) if line.lstrip().startswith("//") else line
        for line in src.split("\n")
    )


def finalize(path: str, threads: bool) -> None:
    with open(path, encoding="utf-8") as f:
        src = f.read()

    code = mask_line_comments(src)
    export = THREADS_EXPORT if threads else "\nexport default Rive;\n"

    if "import.meta" in code:
        sys.exit(
            f"finalize_glue: {path}: contains import.meta — "
            "unexpected emcc output shape (was --oformat=js dropped?)"
        )
    if src.rstrip().endswith(export.strip()):
        if "module.exports" in code:
            sys.exit(
                f"finalize_glue: {path}: finalized export still contains "
                "module.exports"
            )
        if "currentScript" not in code:
            sys.exit(
                f"finalize_glue: {path}: finalized output has no currentScript "
                "location logic"
            )
        print(f"finalize_glue: {path}: already finalized, skipping")
        return

    autostart = ""
    if threads:
        tail = PTHREAD_TAIL.search(code)
        if tail is None:
            sys.exit(
                f"finalize_glue: {path}: no pthread autostart after the UMD "
                "tail — was -pthread dropped, or did emcc drift? update "
                "PTHREAD_TAIL"
            )
        autostart = src[tail.start() :].strip()
        src = src[: tail.start()]
        code = code[: tail.start()]

    matches = list(UMD_TAIL.finditer(code))
    if len(matches) != 1:
        sys.exit(
            f"finalize_glue: {path}: expected exactly 1 UMD tail, found "
            f"{len(matches)} — emcc output shape drifted; update UMD_TAIL"
        )

    glue = src[: matches[0].start()]
    if threads:
        glue = f"function riveGlue() {{\n{glue}\n{autostart}\nreturn Rive;\n}}\nconst Rive = riveGlue();\n"
    out = glue + export
    code_out = code[: matches[0].start()]
    if "module.exports" in code_out:
        sys.exit(f"finalize_glue: {path}: UMD strip left module.exports behind")
    if "currentScript" not in code_out:
        sys.exit(
            f"finalize_glue: {path}: transformed output has no currentScript "
            "location logic"
        )

    with open(path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"finalize_glue: {path}: UMD tail stripped, export default appended")


if __name__ == "__main__":
    args = sys.argv[1:]
    threads = "--threads" in args
    paths = [arg for arg in args if arg != "--threads"]
    if not paths:
        sys.exit("usage: finalize_glue.py [--threads] <glue.mjs> [...]")
    for p in paths:
        finalize(p, threads)
