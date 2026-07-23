#!/bin/bash
set -e

# Verifies that each built npm package's type declarations resolve against the
# files that will actually be published. Catches a .d.ts importing a module
# that isn't shipped in the package
#
# Uses are-the-types-wrong dep, which runs `npm pack` and analyses the tarball, so
# it honours "files" and reproduces exactly what a consumer's compiler sees.
#
# Run AFTER ./build.sh has populated npm/*.

# Resolve everything from this script's own directory (js/), so it works no
# matter what the caller's working directory is (npm run, publish_all.sh, or run
# directly). Avoids depending on $(pwd) matching js/.
cd "$(dirname "${BASH_SOURCE[0]}")"
JS_DIR="$(pwd)"

# High-level runtime packages built by webpack.config.js into npm/ (the ones consumers install).
PACKAGES=(canvas canvas_lite canvas_single webgl2)

# `named-exports` is inherent to these bundled CommonJS packages (TypeScript can
# see named exports that Node cannot statically detect from the single bundled
# rive.js)
IGNORE_RULES="named-exports"

ATTW="$JS_DIR/node_modules/.bin/attw"
if [ ! -x "$ATTW" ]; then
  echo "ERROR: are-the-types-wrong not installed. Run 'npm install' first." >&2
  exit 1
fi

for pkg in "${PACKAGES[@]}"; do
  dir="$JS_DIR/npm/$pkg"
  if [ ! -f "$dir/rive.d.ts" ]; then
    echo "ERROR: $dir/rive.d.ts not found — did ./build.sh run?" >&2
    exit 1
  fi
  echo "==> checking types packaging: @rive-app/$(echo "$pkg" | sed 's/_/-/g')"
  ( cd "$dir" && "$ATTW" --pack . --ignore-rules "$IGNORE_RULES" )
done

echo "All package type declarations resolve ✓"
