# Despliegue

## Local con Docker

```bash
cp .env.example .env        # cambia POSTGRES_PASSWORD
docker compose up -d --build
./scripts/seed.sh           # opcional: datos de ejemplo
```

- Frontend: http://localhost:3000 · API: http://localhost:8080/api/v1 · Swagger: http://localhost:8080/swagger-ui.html
- Si el puerto 5432 está ocupado, cambia `POSTGRES_PORT` en `.env`.
- `seed.sh` crea el dispositivo `esp32-demo` y dos sesiones cerradas (foco y hervidor) con lecturas y una referencia de pinza. Imprime la `api_key` del dispositivo.

## En un servidor (p. ej. un droplet con Docker)

El ESP32 (real o simulado) debe llegar al backend por internet.

1. Instala Docker y Docker Compose en el servidor y clona el repositorio.
2. Crea `.env` con valores propios. Lo importante:
   ```env
   POSTGRES_PASSWORD=<clave larga>
   CORS_ORIGINS=https://panel.midominio.com
   VITE_API_URL=https://api.midominio.com/api/v1
   ```
   `VITE_API_URL` se fija al **construir** el frontend (la usa el navegador), así que si la cambias hay que repetir `docker compose up -d --build`.
3. Publica el backend y el frontend con HTTPS mediante un proxy inverso (Caddy o Nginx con Let's Encrypt) hacia los puertos 8080 y 3000. Cierra el puerto de la base de datos en el firewall.
4. Registra el dispositivo y guarda su `api_key` (se muestra una sola vez):
   ```bash
   curl -s -X POST https://api.midominio.com/api/v1/dispositivos -H 'Content-Type: application/json' -d '{"nombre":"esp32-lab"}'
   ```
5. En el firmware, pon la URL del backend y la `api_key` en `firmware/include/secrets.h` (ver `secrets.h.example`).

## Seguridad

- Los endpoints de gestión **no tienen autenticación** (están pensados para red local). Si el servidor es público, protege el panel y la API de gestión en el proxy (por ejemplo, autenticación básica o una VPN) y deja pasar sin ella solo `POST /api/v1/lecturas` y `GET /api/v1/dispositivos/*/sesion-activa`.
- No subas `.env` ni `secrets.h`.

## CI

`.github/workflows/ci.yml` ejecuta en cada PR: `mvn verify` (backend), `npm test` y `npm run build` (frontend) y `pio test -e native` (firmware).
