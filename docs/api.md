# API REST — `/api/v1`

Swagger UI: `http://localhost:8080/swagger-ui.html` · OpenAPI: `/v3/api-docs`.

Los campos JSON van en `snake_case`. Los errores usan `application/problem+json` (RFC 9457).

> **Medido vs. estimado:** `i_rms` es medido. `p_est` y `energia_*_kwh` son **estimaciones**
> (`P_est = V_ref · I_rms · FP`, con `V_ref = 220 V` y `FP = 1` por defecto). El backend las recalcula; no confía en el firmware.

## Endpoints

| Método | Ruta | Uso |
|---|---|---|
| POST | `/dispositivos` | Registrar dispositivo; devuelve la `api_key` **una sola vez** |
| POST | `/sesiones` | Iniciar sesión (`dispositivo_id`, `carga_declarada`, `v_ref`, `factor_potencia_supuesto`, `notas`) |
| PATCH | `/sesiones/{id}/finalizar` | Cerrar sesión |
| GET | `/sesiones?pagina&tamano` | Listar sesiones con resumen (paginado, máx. 100) |
| GET | `/sesiones/{id}` | Resumen: Irms promedio y máx., energía estimada, n.º de lecturas, % de pérdida |
| GET | `/dispositivos/{id}/sesion-activa` | El ESP32 consulta a qué sesión enviar (requiere `X-Device-Key`) |
| POST | `/lecturas` | Ingesta desde el ESP32 (`X-Device-Key`), en lote |
| GET | `/sesiones/{id}/lecturas?desde&hasta` | Serie temporal (fechas ISO-8601) |
| GET | `/sesiones/{id}/ultima` | Última lectura (vista en vivo) |
| POST | `/sesiones/{id}/referencias` | Registrar lectura de la pinza amperimétrica |
| GET | `/sesiones/{id}/validacion` | Prototipo vs. pinza + error medio absoluto (A) y porcentual |
| GET | `/sesiones/{id}/export.csv` | Exportar lecturas |

## Reglas

- Solo puede haber **una sesión activa por dispositivo** (si no, `409`).
- `i_rms` válido: `0 ≤ i_rms ≤ 100` (si no, `400`). `intervalo_s > 0`.
- La ingesta es **idempotente por `secuencia`**: reenviar una lectura ya guardada se cuenta como `duplicadas`.
- `timestamp` (opcional, ISO-8601 o epoch en segundos): si el ESP32 no tiene hora NTP, se omite y se usa la del servidor.
- `% de pérdida = (esperadas − recibidas) / esperadas`, con `esperadas = secuencia_máx − secuencia_mín + 1` dentro de la sesión.
- En `POST /sesiones/{id}/referencias`, si no se envía `i_prototipo` se usa la última lectura del prototipo anterior a `timestamp`.
- Los endpoints de gestión (sesiones, validación, exportación) **no tienen autenticación**: están pensados para una red local o de laboratorio.
  Solo la ingesta y `sesion-activa` exigen `X-Device-Key`.

## Ejemplo con curl

```bash
B=http://localhost:8080/api/v1

# 1. Registrar el dispositivo (guarda la api_key: no se vuelve a mostrar)
curl -s -X POST $B/dispositivos -H 'Content-Type: application/json' \
  -d '{"nombre":"esp32-lab"}'
# {"id":1,"nombre":"esp32-lab","creado_en":"...","api_key":"<KEY>"}

# 2. Iniciar una sesión declarando la carga
curl -s -X POST $B/sesiones -H 'Content-Type: application/json' \
  -d '{"dispositivo_id":1,"carga_declarada":"Foco 100 W"}'

# 3. Enviar lecturas (como lo haría el ESP32)
curl -s -X POST $B/lecturas -H "X-Device-Key: <KEY>" -H 'Content-Type: application/json' \
  -d '{"lecturas":[{"secuencia":1,"i_rms":0.45,"intervalo_s":5},
                   {"secuencia":2,"i_rms":0.46,"intervalo_s":5}]}'
# {"aceptadas":2,"duplicadas":0}

# 4. Consultar el resumen
curl -s $B/sesiones/1
# {... "n_lecturas":2,"i_rms_promedio":0.455,"i_rms_max":0.46,
#      "energia_estimada_kwh":0.000278,"porcentaje_perdida":0.0}

# 5. Comparar con la pinza amperimétrica
curl -s -X POST $B/sesiones/1/referencias -H 'Content-Type: application/json' \
  -d '{"i_pinza":0.46}'
curl -s $B/sesiones/1/validacion

# 6. Exportar y cerrar
curl -s $B/sesiones/1/export.csv
curl -s -X PATCH $B/sesiones/1/finalizar
```
