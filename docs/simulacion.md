# Simulación en Wokwi

Wokwi no tiene un sensor SCT-013, así que su salida se simula con un **chip personalizado** (`simulation/chips/ct-sim.chip.c`) que escribe en un pin analógico:

```
V(t) = V_bias + (R_b / N_s) · √2 · I_rms · sin(2π · f · t)
```

| Atributo | Unidad | Por defecto | Uso |
|---|---|---|---|
| `irms` | A | 0,45 | Corriente del primario (también hay un **control deslizante** en vivo) |
| `vbias` | V | 1,32 | Nivel de continua del divisor |
| `rb` | Ω | 47 | Resistencia de carga |
| `ns` | — | 2000 | Relación del TC |
| `freq` | Hz | 60 | Frecuencia de la red |

La salida se actualiza cada 100 µs (≈ 166 puntos por ciclo) y se limita a 0–3,3 V. Con los valores por defecto, la señal sale del rango confiable del ADC (150–2450 mV) por encima de **≈ 35 A**.

## Circuito (`simulation/diagram.json`)

| Componente | Conexión |
|---|---|
| ESP32 DevKit C v4 | — |
| `ct-sim` OUT | GPIO34 (ADC1) |
| Potenciómetro SIG | GPIO35 (solo para el plan B) |
| LED + 220 Ω | GPIO2: encendido = Wi-Fi conectado; parpadea al enviar |

## 1. Compilar

```bash
cd firmware
cp include/secrets.example.h include/secrets.h   # API_BASE_URL, DEVICE_ID y DEVICE_API_KEY
pio run -e wokwi

cd ../simulation
./chips/build.sh       # compila el chip a ct-sim.chip.wasm (requiere Docker)
```

En el entorno `wokwi` el firmware usa la red `Wokwi-GUEST` (sin contraseña) e ignora `WIFI_SSID` y `WIFI_PASSWORD`.

## 2. Abrir la simulación

### Opción A: extensión de VS Code (recomendada)

1. Instala la extensión **Wokwi Simulator** y activa la licencia (gratuita) con `F1 → Wokwi: Request a New License`.
2. Abre el archivo `simulation/diagram.json`.
3. `F1 → Wokwi: Start Simulator`. Lee `simulation/wokwi.toml`, que apunta al firmware de `.pio/build/wokwi` y al chip compilado.

### Opción B: wokwi.com

1. Crea un proyecto nuevo de **ESP32**.
2. Reemplaza el contenido de `diagram.json` por el de `simulation/diagram.json`.
3. Agrega el chip: `+` (nuevo archivo) → `ct-sim.chip.json` y `ct-sim.chip.c`, con el contenido de `simulation/chips/`. El sitio compila el chip.
4. Con el editor enfocado, `F1 → Upload Firmware and Start Simulation…` y sube `firmware/.pio/build/wokwi/firmware.bin`.

## 3. Conectar con el backend

El ESP32 simulado sale a internet por el **gateway público** de Wokwi; no puede llegar a `localhost`.

- **Opción gratuita, con túnel:** expone el backend local y usa esa URL en `API_BASE_URL`:
  ```bash
  cloudflared tunnel --url http://localhost:8080      # o: ngrok http 8080
  ```
  El firmware acepta `https://`. No verifica el certificado, lo que es suficiente para el laboratorio.
- **Opción de pago (Wokwi Club):** activa el gateway privado y usa `http://host.wokwi.internal:8080`.

Recuerda registrar el dispositivo e **iniciar una sesión** antes. Sin sesión activa, el backend responde 404 y el firmware descarta las lecturas (ver [api.md](api.md)).

## 4. Verificar (criterio de aceptación)

| `irms` en el chip | Carga equivalente | Serial esperado (±2 %) |
|---|---|---|
| 0,45 | Foco de 100 W | `Irms=0.441`–`0.459 A  P_est≈99 W` |
| 5,45 | Plancha de 1200 W | `Irms≈5.45 A  P_est≈1200 W` |
| 9,09 | Hervidor de 2000 W | `Irms≈9.09 A  P_est≈2000 W` |

Mueve el control deslizante del chip y comprueba que el valor cambia en la siguiente lectura (5 s). En el backend:

```bash
curl -s $B/sesiones/<id>/ultima
```

El cálculo del chip se verificó fuera de Wokwi, ejecutando el wasm con la API simulada y una ventana de 200 ms cuantizada a mV. El error fue de 0,38 % con 0,45 A y menor de 0,01 % entre 5 y 30 A. Si el ADC simulado de Wokwi se desvía del valor esperado, ajusta `K_CAL` o usa el plan B.

## Plan B: muestras generadas por software

Si la simulación analógica resulta inestable, compila el entorno `wokwi-software`. El firmware genera las muestras con la **misma fórmula**, y el **potenciómetro de GPIO35** fija la `I_rms` simulada, de 0 a 30 A.

```bash
pio run -e wokwi-software
```

Y en `simulation/wokwi.toml` cambia las rutas a `.pio/build/wokwi-software/`. En este modo el chip `ct-sim` se ignora.
