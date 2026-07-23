#!/bin/bash
set -e

# Fail first if any built package's type declarations don't resolve against its
# published contents (e.g. a .d.ts importing a dir missing from the package).
./check_types.sh

# Bump the version number of every npm module in the npm folder.
for dir in ./npm/*; do
    pushd $dir > /dev/null
    echo Publishing `echo $dir | sed 's:.*/::'`
    npm publish $@
    popd > /dev/null
done
