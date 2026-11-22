#!/usr/bin/env bash
# Actualiza el servidor con lo último de main y reconstruye los contenedores.
# Lo ejecuta el CI por SSH después de que pasan las pruebas (también sirve a mano).
set -euo pipefail
cd "$(dirname "$0")/.."

exec 9>/tmp/monitor-energia-deploy.lock
flock -n 9 || { echo "Ya hay un despliegue en curso."; exit 1; }

git fetch --quiet origin main
git merge --ff-only origin/main
echo "Desplegando $(git log --oneline -1)"

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -f >/dev/null

for _ in $(seq 1 40); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${BACKEND_PORT:-8011}/api/v1/sesiones?tamano=1"; then
    echo "Backend en línea."
    exit 0
  fi
  sleep 3
done
echo "El backend no respondió a tiempo." >&2
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail 50 backend >&2
exit 1
