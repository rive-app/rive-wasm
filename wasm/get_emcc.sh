#!/bin/bash
set -e

echo "Setting up Emscripten SDK [build triggered]..."

if [[ ! -f "bin/emsdk/emsdk_env.sh" ]]; then
    echo "Setting up Emscripten SDK..."
    mkdir -p bin
    pushd bin
    
    # Retry git clone with exponential backoff
    for attempt in 1 2 3; do
        echo "Attempt $attempt: Cloning emsdk repository..."
        if git clone https://github.com/emscripten-core/emsdk.git; then
            echo "Successfully cloned emsdk repository"
            break
        else
            echo "Git clone failed on attempt $attempt"
            if [ $attempt -lt 3 ]; then
                wait_time=$((2 ** attempt))
                echo "Waiting $wait_time seconds before retry..."
                sleep $wait_time
            else
                echo "All git clone attempts failed. Exiting."
                exit 1
            fi
        fi
    done
    
    pushd emsdk
    echo "Installing Emscripten SDK version 3.1.61..."
    if ! ./emsdk install 3.1.61; then
        echo "Failed to install Emscripten SDK version 3.1.61"
        exit 1
    fi
    
    echo "Activating Emscripten SDK version 3.1.61..."
    if ! ./emsdk activate 3.1.61; then
        echo "Failed to activate Emscripten SDK version 3.1.61"
        exit 1
    fi
    
    popd
    popd
    echo "Emscripten SDK setup complete"
fi

echo "Sourcing Emscripten SDK environment..."
if ! source ./bin/emsdk/emsdk_env.sh; then
    echo "Failed to source Emscripten SDK environment"
    exit 1
fi

echo "Emscripten SDK environment loaded successfully"