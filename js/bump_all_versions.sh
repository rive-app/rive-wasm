#!/bin/bash
set -e

# Bump the version number of every npm module in the npm folder.
for dir in ./npm/*; do
    pushd $dir > /dev/null
    repo_name=`echo $dir | sed 's:.*/::' | sed 's/_/-/g'`
    echo Bumping version of $repo_name
    echo Version $1
    ../../bump_version.sh $repo_name $1
    popd > /dev/null
done
