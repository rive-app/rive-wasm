#!/bin/bash
set -e

get_size_diff() {
    WASM_FILE=$1
    TECH=$2

    SIZE=$(stat -f%z $WASM_FILE)
    RESULT=$(psql postgresql://${RUNTIME_METRICS_DB_USER}:${RUNTIME_METRICS_DB_PASSWORD}@${RUNTIME_METRICS_DB_HOST}:6543/postgres -t -v tech=$TECH <<<"
        SELECT size FROM \"WasmSize\" WHERE tech=:'tech' ORDER BY id DESC LIMIT 1
    ")
    
    PERCENT=$(node -pe "Math.round((${SIZE}-${RESULT})/${RESULT}*100*100)/100")
    

    LEGIBLE_CHANGE=$(node -p <<DELIMITER
function formatBytes(bytes, decimals) {
  const factor = bytes < 0 ? '-' : '+';
  bytes = Math.abs(bytes);
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return factor + parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' +sizes[i];
}
formatBytes($SIZE-$RESULT, 2);
DELIMITER)

    echo "$LEGIBLE_CHANGE ($PERCENT%)"

}

for var in "$@"; do
    if [[ $var = "canvas" ]]; then
        get_size_diff js/npm/canvas_advanced/rive.wasm canvas
    fi
    if [[ $var = "webgl" ]]; then
        get_size_diff js/npm/webgl2_advanced/rive.wasm webgl
    fi
    if [[ $var = "lite" ]]; then
        get_size_diff js/npm/canvas_advanced_lite/rive.wasm lite
    fi
done