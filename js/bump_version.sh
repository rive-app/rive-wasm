#!/bin/bash
set -e
NPM_VERSIONS=`npm show rive-js versions`
node next_version.js "$NPM_VERSIONS"
