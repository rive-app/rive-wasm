#!/bin/bash
set -e

# All variants build on emsdk 4.0.23 (required by the upcoming WebGPU
# renderer's emdawnwebgpu port). Override via RIVE_WASM_EMSDK_VERSION if
# needed. Installs into a versioned dir so multiple toolchains can coexist.
EMSDK_VERSION="${RIVE_WASM_EMSDK_VERSION:-4.0.23}"
EMSDK_DIR="bin/emsdk_${EMSDK_VERSION}"

echo "Setting up Emscripten SDK ${EMSDK_VERSION} [build triggered]..."

if [[ ! -f "${EMSDK_DIR}/emsdk_env.sh" ]]; then
    echo "Setting up Emscripten SDK ${EMSDK_VERSION}..."
    mkdir -p "$(dirname "${EMSDK_DIR}")"

    # Retry git clone with exponential backoff
    for attempt in 1 2 3; do
        echo "Attempt $attempt: Cloning emsdk repository..."
        if git clone https://github.com/emscripten-core/emsdk.git "${EMSDK_DIR}"; then
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

    pushd "${EMSDK_DIR}"
    echo "Installing Emscripten SDK version ${EMSDK_VERSION}..."
    if ! ./emsdk install "${EMSDK_VERSION}"; then
        echo "Failed to install Emscripten SDK version ${EMSDK_VERSION}"
        exit 1
    fi

    echo "Activating Emscripten SDK version ${EMSDK_VERSION}..."
    if ! ./emsdk activate "${EMSDK_VERSION}"; then
        echo "Failed to activate Emscripten SDK version ${EMSDK_VERSION}"
        exit 1
    fi

    popd
    echo "Emscripten SDK setup complete"
fi

echo "Sourcing Emscripten SDK environment..."
if ! source "./${EMSDK_DIR}/emsdk_env.sh"; then
    echo "Failed to source Emscripten SDK environment"
    exit 1
fi

echo "Emscripten SDK environment loaded successfully"
