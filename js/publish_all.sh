#!/bin/bash
set -e

# Fail first if any built package's type declarations don't resolve against its
# published contents (e.g. a .d.ts importing a dir missing from the package).
./check_types.sh

# A rerun after a partial release skips what already went out, and a transient
# provenance or registry error gets another try.
publish() {
    local spec="$(node -p "require('./package.json').name")@$(node -p "require('./package.json').version")"
    for attempt in 1 2 3; do
        if npm view "$spec" version > /dev/null 2>&1; then
            echo "$spec is already published"
            return 0
        fi
        if npm publish "$@"; then
            return 0
        fi
        echo "Publishing $spec failed (attempt $attempt)"
        sleep 30
    done
    # The last attempt may have gone out despite its error.
    npm view "$spec" version > /dev/null 2>&1
}

for dir in ./npm/*; do
    pushd $dir > /dev/null
    echo Publishing `echo $dir | sed 's:.*/::'`
    publish "$@"
    popd > /dev/null
done
