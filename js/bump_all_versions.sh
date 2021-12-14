#!/bin/bash
set -e

for dir in ./npm/*; do
# echo $dir
    pushd $dir > /dev/null
    echo Bumping version of `echo $dir | sed 's:.*/::'`
    ../../bump_version.sh
    popd > /dev/null
done
# SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# NPM_VERSIONS=`npm show rive-js versions`
# node $SCRIPT_DIR/next_version.js "$NPM_VERSIONS" `pwd`
