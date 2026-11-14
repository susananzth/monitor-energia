#!/usr/bin/env sh
# Compila el chip personalizado a WebAssembly con la imagen oficial de Wokwi.
# Uso: ./simulation/chips/build.sh   (requiere Docker)
set -eu
cd "$(dirname "$0")"

if [ ! -f wokwi-api.h ]; then
  curl -sfL https://wokwi.com/api/chips/wokwi-api.h -o wokwi-api.h
fi

docker run --rm -u "$(id -u):$(id -g)" -v "$PWD":/src -w /src --entrypoint clang \
  wokwi/builder-clang-wasm:latest \
  --target=wasm32-unknown-wasi --sysroot /opt/wasi-libc -nostartfiles \
  -Wl,--import-memory -Wl,--export-table -Wl,--no-entry \
  -O2 -Wall -Werror -Wno-unused-function \
  -o ct-sim.chip.wasm ct-sim.chip.c

echo "OK: $(pwd)/ct-sim.chip.wasm"
