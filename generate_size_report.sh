#!/bin/bash
set -e

# Expects TITLE and URL in ENV

pushd js

./build.sh

command -v psql >/dev/null || brew install postgresql
command -v brotli >/dev/null || brew install brotli

report_size() {
    WASM_FILE=$1
    TECH=$2
    rm -f $WASM_FILE.br
    brotli -9 $WASM_FILE

    SIZE=$(stat -f%z $WASM_FILE)
    SIZE_BR=$(stat -f%z $WASM_FILE.br)
    psql postgresql://${RUNTIME_METRICS_DB_USER}:${RUNTIME_METRICS_DB_PASSWORD}@${RUNTIME_METRICS_DB_HOST}:6543/postgres -v tech=$TECH -v size=$SIZE -v size_br=$SIZE_BR -v url="$URL" -v title="$TITLE" <<< "
        INSERT INTO \"WasmSize\" (size, size_compressed, pr, link, tech) VALUES (
            :'size', :'size_br', :'title', :'url', :'tech')
    "
}

report_size npm/canvas_advanced/rive.wasm canvas
report_size npm/webgl2_advanced/rive.wasm webgl
report_size npm/canvas_advanced_lite/rive.wasm lite

popd
