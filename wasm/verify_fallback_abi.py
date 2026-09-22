#!/usr/bin/env python3
"""Verify that a fallback wasm is ABI-compatible with its primary wasm.

We ship a single JS glue per package, generated from the primary build, but two
binaries: rive.wasm and rive_fallback.wasm (the same sources linked with
--no-wasm-simd and a lower browser baseline). The glue resolves the wasm's
imports by name and reads its exports by name, so the fallback only works if
both binaries agree on them.

Two emcc settings decide whether that holds, both pinned in premake5.lua:

  - Name minification. -Os turns on MINIFY_WASM_EXPORT_NAMES, which renames
    imports/exports to per-build ordinals (a.a, a.b, ...) numbered in each
    binary's own import order -- an order the two link configurations do not
    agree on. -lexports.js keeps the names literal.
  - WASM_BIGINT. When 0 it implies LEGALIZE_JS_FFI, which splits every i64 at
    the JS boundary into two i32s, changing both the import list and its
    signatures. emcc otherwise derives it from the browser baseline, which the
    two builds do not share, so it is pinned to 0 for both.

A mismatch is silent at load time: JS functions are not type-checked when
imported into wasm, so instantiation succeeds and the fallback calls the wrong
JS function at first use. Hence a build-time check.

Usage: verify_fallback_abi.py <primary.wasm> <fallback.wasm>
Exits non-zero, naming the offending entries, when the two disagree.
"""

import hashlib
import io
import re
import sys

VALTYPE = {
    0x7F: "i32",
    0x7E: "i64",
    0x7D: "f32",
    0x7C: "f64",
    0x7B: "v128",
    0x70: "funcref",
    0x6F: "externref",
}

KINDS = {0: "func", 1: "table", 2: "memory", 3: "global", 4: "tag"}

# The module names emcc emits when minification is off. Anything else (a
# single letter, typically "a") means it is on -- see -lexports.js in
# premake5.lua.
LITERAL_MODULES = {"env", "wasi_snapshot_preview1", "GOT.mem", "GOT.func"}

# The same switch minifies module names and symbol names, but only module names
# are a fixed set we can test against. Catch the other half by rejecting one-
# and two-character symbols: a minified build has hundreds, and neither
# emscripten nor Rive exports a name that short.
MINIFIED_SYMBOL = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$]?$")


def _uleb(f):
    result = shift = 0
    while True:
        byte = f.read(1)[0]
        result |= (byte & 0x7F) << shift
        shift += 7
        if not byte & 0x80:
            return result


def _sleb(f):
    result = shift = 0
    while True:
        byte = f.read(1)[0]
        result |= (byte & 0x7F) << shift
        shift += 7
        if not byte & 0x80:
            if byte & 0x40:
                result -= 1 << shift
            return result


def _name(f):
    return f.read(_uleb(f)).decode("utf8", "replace")


def _limits(f):
    # bit 0 = has max, bit 1 = shared, bit 2 = 64-bit index space
    flags = _uleb(f)
    _uleb(f)  # min
    if flags & 1:
        _uleb(f)  # max


def _functype(f):
    assert f.read(1)[0] == 0x60, "expected a func type"
    params = [VALTYPE.get(f.read(1)[0], "?") for _ in range(_uleb(f))]
    results = [VALTYPE.get(f.read(1)[0], "?") for _ in range(_uleb(f))]
    return "(%s) -> (%s)" % (", ".join(params), ", ".join(results))


def _const_offset(f):
    """Read an init_expr, returning its constant value, or None if not one."""
    op = f.read(1)[0]
    if op in (0x41, 0x42):  # i32.const / i64.const
        value = _sleb(f)
    else:  # global.get or anything else we do not model
        _uleb(f)
        value = None
    while True:  # consume through the 0x0B terminator
        byte = f.read(1)
        if not byte or byte[0] == 0x0B:
            return value


class Abi:
    """The parts of a wasm module the shared JS glue actually binds to."""

    def __init__(self):
        self.imports = {}  # (module, field) -> "func <sig>" / "table" / ...
        self.exports = {}  # name -> "func <sig>" / "table" / ...
        self.segments = []  # [(offset, size, content_sha12)]

    @property
    def modules(self):
        return {module for module, _ in self.imports}


def read_abi(path):
    data = open(path, "rb").read()
    f = io.BytesIO(data)
    if f.read(4) != b"\0asm":
        raise SystemExit("%s: not a wasm module" % path)
    f.read(4)  # version

    abi = Abi()
    types, func_types, imported_func_types = [], [], []

    while True:
        head = f.read(1)
        if not head:
            break
        section_id = head[0]
        body = io.BytesIO(f.read(_uleb(f)))

        if section_id == 1:  # type
            types = [_functype(body) for _ in range(_uleb(body))]

        elif section_id == 2:  # import
            for _ in range(_uleb(body)):
                module, field = _name(body), _name(body)
                kind = body.read(1)[0]
                if kind == 0:  # func
                    sig = types[_uleb(body)]
                    imported_func_types.append(sig)
                    desc = "func %s" % sig
                elif kind == 1:  # table
                    body.read(1)  # reftype
                    _limits(body)
                    desc = "table"
                elif kind == 2:  # memory
                    _limits(body)
                    desc = "memory"
                elif kind == 3:  # global
                    valtype = VALTYPE.get(body.read(1)[0], "?")
                    mutable = body.read(1)[0]
                    desc = "global %s%s" % (valtype, " mut" if mutable else "")
                elif kind == 4:  # tag
                    body.read(1)  # attribute
                    desc = "tag %s" % types[_uleb(body)]
                else:
                    raise SystemExit("%s: unknown import kind %d" % (path, kind))
                abi.imports[(module, field)] = desc

        elif section_id == 3:  # function
            func_types = [types[_uleb(body)] for _ in range(_uleb(body))]

        elif section_id == 7:  # export
            for _ in range(_uleb(body)):
                name = _name(body)
                kind = body.read(1)[0]
                index = _uleb(body)
                if kind == 0:  # func
                    all_funcs = imported_func_types + func_types
                    sig = all_funcs[index] if index < len(all_funcs) else "?"
                    abi.exports[name] = "func %s" % sig
                else:
                    abi.exports[name] = KINDS.get(kind, "kind%d" % kind)

        elif section_id == 11:  # data
            for _ in range(_uleb(body)):
                flags = _uleb(body)
                offset = None
                if flags == 2:
                    _uleb(body)  # memidx
                if flags in (0, 2):
                    offset = _const_offset(body)
                payload = body.read(_uleb(body))
                abi.segments.append(
                    (offset, len(payload), hashlib.sha256(payload).hexdigest()[:12])
                )

    return abi


def check(primary, fallback):
    """Compare two Abi objects, returning a list of incompatibilities."""
    problems = []

    # 1. Names must be literal, or nothing below means anything: two binaries
    # can agree on an ordinal that refers to a different function in each.
    for label, abi in (("primary", primary), ("fallback", fallback)):
        minified = sorted(abi.modules - LITERAL_MODULES)
        if minified:
            problems.append(
                "%s uses minified import module names (%s) -- expected literal names. "
                "emcc's wasm import/export minification is enabled; check that the "
                "release link line in premake5.lua still passes -lexports.js."
                % (label, ", ".join(repr(m) for m in minified))
            )
            continue
        short = sorted(
            {f for _, f in abi.imports if MINIFIED_SYMBOL.match(f)}
            | {n for n in abi.exports if MINIFIED_SYMBOL.match(n)}
        )
        if short:
            problems.append(
                "%s has %d one- or two-character symbol name(s) (%s%s) -- these are "
                "minified. Module names look literal, so minification is partly "
                "enabled; check -lexports.js in premake5.lua."
                % (
                    label,
                    len(short),
                    ", ".join(repr(n) for n in short[:8]),
                    ", ..." if len(short) > 8 else "",
                )
            )
    if problems:
        return problems  # everything below would be noise

    # 2. Imports bind by (module, field), so declaration order does not matter.
    # What matters is that every import the fallback declares exists in the glue
    # -- which was generated from the primary -- with the same signature.
    missing, mismatched = [], []
    for key, desc in sorted(fallback.imports.items()):
        if key not in primary.imports:
            missing.append((key, desc))
        elif primary.imports[key] != desc:
            mismatched.append((key, primary.imports[key], desc))

    if missing:
        problems.append(
            "%d import(s) exist only in the fallback, so the glue has nothing to bind "
            "them to (instantiation would throw LinkError):" % len(missing)
        )
        for (module, field), desc in missing[:20]:
            problems.append("    %s.%s  %s" % (module, field, desc))

    if mismatched:
        problems.append(
            "%d import(s) share a name but not a signature (the glue would pass the "
            "wrong arguments):" % len(mismatched)
        )
        for (module, field), want, got in mismatched[:20]:
            problems.append(
                "    %s.%s\n        primary : %s\n        fallback: %s"
                % (module, field, want, got)
            )

    # 3. The glue reads exports by name, so the fallback must carry everything
    # the primary does, with the same signature. Extra exports are harmless.
    for name, desc in sorted(primary.exports.items()):
        if name not in fallback.exports:
            problems.append("fallback is missing export %r (%s)" % (name, desc))
        elif fallback.exports[name] != desc:
            problems.append(
                "export %r differs:\n        primary : %s\n        fallback: %s"
                % (name, desc, fallback.exports[name])
            )

    # 4. EM_ASM (used by miniaudio) compiles to emscripten_asm_const_int(addr),
    # where addr identifies the JS source and the glue dispatches ASM_CONSTS[addr].
    # That table is baked from the primary, so the fallback has to agree on those
    # addresses. They are immediates in the code section, which this script does
    # not decode, so the data section stands in for them: an identical data
    # section means the static layout those addresses are allocated from is
    # identical. Comparing contents and not just offsets is deliberate -- equal
    # offsets and sizes would not prove that addresses *within* a segment stayed
    # put, since reordering two strings inside one segment moves both.
    if primary.segments != fallback.segments:
        problems.append(
            "data sections differ (%d vs %d segments) -- the static layout is not "
            "identical, so EM_ASM addresses baked into the glue from the primary may "
            'not match the fallback, and audio init would fail with "ASM_CONSTS[...] '
            'is not a function"' % (len(primary.segments), len(fallback.segments))
        )
        for i, (a, b) in enumerate(zip(primary.segments, fallback.segments)):
            if a != b:
                kind = "offset/size" if a[:2] != b[:2] else "contents"
                problems.append(
                    "    first difference at segment #%d (%s): %s vs %s"
                    % (i, kind, a, b)
                )
                break

    return problems


def main(argv):
    if len(argv) != 3:
        raise SystemExit("usage: verify_fallback_abi.py <primary.wasm> <fallback.wasm>")
    primary_path, fallback_path = argv[1], argv[2]
    primary = read_abi(primary_path)
    fallback = read_abi(fallback_path)
    problems = check(primary, fallback)

    if problems:
        print("FAIL: fallback wasm is not ABI-compatible with the primary wasm")
        print("  primary : %s" % primary_path)
        print("  fallback: %s" % fallback_path)
        for line in problems:
            print("  " + line)
        return 1

    print(
        "OK: %s matches %s (%d imports, %d exports, %d data segments)"
        % (
            fallback_path,
            primary_path,
            len(primary.imports),
            len(primary.exports),
            len(primary.segments),
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
