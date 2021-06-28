set -e

# GET hash of CPP MASTER.
RIVE_CPP_MASTER_HASH=$(git ls-remote https://github.com/rive-app/rive-cpp.git refs/heads/master | awk '{print $1}')
echo rive-cpp master is at $RIVE_CPP_MASTER_HASH


# GET hash of Submodule.
RIVE_WASM_CPP_SUBMODULE_HASH=$(git submodule | grep rive-cpp |awk '{print $1}' | sed -En 's/-*(.*)/\1/p')

echo rive-wasm cpp submodule is at $RIVE_WASM_CPP_SUBMODULE_HASH

if [ "$RIVE_CPP_MASTER_HASH" == "$RIVE_WASM_CPP_SUBMODULE_HASH" ]
then 
    echo "They match. all is good"
else 
    # Just full on assuming this is behind for the time being. 
    # Could put in some 'useful' links into this message. Once we have something useful to do (other than update & rebuild)
    curl -X POST -H 'Content-type: application/json' --data '{"text":"`rive-wasm` is behind rive-cpp!"}' $SLACK_WEBHOOK
fi 