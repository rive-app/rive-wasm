#!/bin/bash
set -e
LOCAL_VERSION=`node -p "require('./package.json').version"`
NPM_VERSION=`npm show rive-canvas version`

echo Local version is $LOCAL_VERSION and NPM is $NPM_VERSION
if [ $LOCAL_VERSION != $NPM_VERSION ]; then 
    npm publish
fi