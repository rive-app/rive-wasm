#!/bin/bash
set -e
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
NPM_VERSIONS=`npm show rive-js versions`
node $SCRIPT_DIR/next_version.js "$NPM_VERSIONS" `pwd`
