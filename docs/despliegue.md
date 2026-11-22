# Despliegue

## Local con Docker

```bash
cp .env.example .env        # cambia POSTGRES_PASSWORD
docker compose up -d --build
./scripts/seed.sh           # opcional: datos de ejemplo (inicia sesión con ADMIN_USUARIO y ADMIN_PASSWORD de .env)
```

- Frontend: http://localhost:3000 · API: http://localhost:8080/api/v1 · Swagger: http://localhost:8080/swagger-ui.html
- Si el puerto 5432 está ocupado, cambia `POSTGRES_PORT` en `.env`.
- `seed.sh` crea el dispositivo `esp32-demo` y dos sesiones cerradas (foco y hervidor) con lecturas y una referencia de pinza. Imprime la `api_key` del dispositivo.

## En un servidor (p. ej. un droplet con Docker)

El ESP32 (real o simulado) debe llegar al backend por internet. Se usa un solo dominio: el proxy del servidor envía `/api/` al backend y el resto a la web.

1. Instala Docker, Docker Compose y Nginx con Certbot en el servidor, y clona el repositorio.
2. Crea `.env` con valores propios:
   ```env
   POSTGRES_PASSWORD=<clave larga>
   ADMIN_USUARIO=admin
   ADMIN_PASSWORD=<clave larga>   # solo crea el primer admin si no hay usuarios
   CORS_ORIGINS=https://monitor.midominio.com
   VITE_API_URL=https://monitor.midominio.com/api/v1
   # opcionales: BACKEND_PORT=8011  FRONTEND_PORT=8010
   ```
3. Levanta con el archivo de producción, que solo publica en `127.0.0.1` (la base de datos no queda expuesta) y limita la memoria de Java:
   ```bash
   ./scripts/deploy.sh      # git pull de main + docker compose (prod) + verificación
   ```
4. Sitio de Nginx (luego `certbot --nginx -d monitor.midominio.com` agrega HTTPS):
   ```nginx
   server {
       listen 80;
       server_name monitor.midominio.com;
       location /api/ { proxy_pass http://127.0.0.1:8011; include proxy_params; }
       location /     { proxy_pass http://127.0.0.1:8010; include proxy_params; }
   }
   ```
5. Entra a la web con el admin, cambia su contraseña en **Mi cuenta** y crea las cuentas del equipo en **Equipo**.
   Ahí mismo registra el dispositivo: muestra el `DEVICE_ID` y la `api_key` una sola vez.
6. En el firmware, pon `API_BASE_URL` (sin `/api/v1`) y la `api_key` en `firmware/include/secrets.h`.

## Despliegue continuo

En cada push a `main`, si pasan las pruebas, el job `desplegar` del CI entra por SSH y ejecuta `scripts/deploy.sh`.

- En el servidor, la llave del CI se autoriza **restringida** a ese script:
  ```
  command="/ruta/al/repo/scripts/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA... ci
  ```
- Secretos del repositorio en GitHub: `DEPLOY_SSH_KEY` (llave privada), `DEPLOY_HOST` (`usuario@ip`) y `DEPLOY_KNOWN_HOSTS` (salida de `ssh-keyscan <ip>`).

## Seguridad

- La web y la API piden usuario y contraseña. Solo las rutas del ESP32 quedan sin login, protegidas con su `X-Device-Key`.
- El token se guarda en el navegador (`localStorage`) y dura 12 h; "Salir" lo invalida en el servidor.
- No subas `.env` ni `secrets.h`.

## CI

`.github/workflows/ci.yml` ejecuta en cada PR y push a `main`: `mvn verify` (backend), `npm test` y `npm run build` (frontend) y `pio test -e native` (firmware).
