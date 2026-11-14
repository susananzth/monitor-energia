#!/usr/bin/env bash
# Carga datos de ejemplo: un dispositivo y dos sesiones cerradas (foco y hervidor).
# Uso: ./scripts/seed.sh [URL_API]   (por defecto http://localhost:8080/api/v1)
set -euo pipefail
B="${1:-http://localhost:8080/api/v1}"
post() { curl -fsS -X POST "$B$1" -H 'Content-Type: application/json' "${@:2}"; }

KEY_JSON=$(post /dispositivos -d '{"nombre":"esp32-demo"}')
DISP=$(sed -E 's/.*"id":([0-9]+).*/\1/' <<<"$KEY_JSON")
KEY=$(sed -E 's/.*"api_key":"([^"]+)".*/\1/' <<<"$KEY_JSON")

# sesion NOMBRE I_BASE N_LECTURAS  (lecturas cada 5 s con ruido ±3 %, terminando ahora)
sesion() {
  local nombre=$1 base=$2 n=$3
  local id lote="" ahora ts i irms
  id=$(post /sesiones -d "{\"dispositivo_id\":$DISP,\"carga_declarada\":\"$nombre\"}" | sed -E 's/.*"id":([0-9]+).*/\1/')
  ahora=$(date +%s)
  for ((i = 1; i <= n; i++)); do
    ts=$(date -u -d "@$((ahora - (n - i) * 5))" +%Y-%m-%dT%H:%M:%SZ)
    irms=$(awk -v b="$base" -v s="$RANDOM" 'BEGIN{srand(s); printf "%.4f", b*(1+(rand()-0.5)*0.06)}')
    lote+="{\"secuencia\":$i,\"i_rms\":$irms,\"intervalo_s\":5,\"timestamp\":\"$ts\"},"
  done
  curl -fsS -X POST "$B/lecturas" -H "X-Device-Key: $KEY" -H 'Content-Type: application/json' \
    -d "{\"lecturas\":[${lote%,}]}" >/dev/null
  curl -fsS -X PATCH "$B/sesiones/$id/finalizar" >/dev/null
  post "/sesiones/$id/referencias" -d "{\"i_pinza\":$(awk -v b="$base" 'BEGIN{printf "%.3f", b*1.02}')}" >/dev/null
  echo "Sesión $id ($nombre): $n lecturas"
}

sesion "Foco 100 W" 0.45 60
sesion "Hervidor 1500 W" 6.8 60
echo "Listo. Dispositivo $DISP, api_key: $KEY"
