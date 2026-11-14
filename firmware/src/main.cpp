// Monitor de consumo eléctrico no invasivo — ESP32 + SCT-013-000
// Mide Irms (medido) y lo envía al backend, que estima potencia y energía (V_ref = 220 V, FP = 1).

#include <Arduino.h>
#include <Preferences.h>

#include "ClienteApi.h"
#include "MedidorCorriente.h"
#include "calculo_irms.h"
#include "config.h"

namespace {

MedidorCorriente medidor(config::PIN_ADC, {config::R_B_OHM, config::N_S, config::K_CAL, config::I_MIN_A},
                         config::VENTANA_MS, config::ADC_MIN_MV, config::ADC_MAX_MV);
ClienteApi api;
ColaLecturas cola;
medicion::AcumuladorIntervalo intervalo;
Preferences preferencias;

uint32_t secuencia = 1;
uint32_t secuencia_reservada = 0;
uint32_t ultima_medicion_ms = 0;
uint32_t inicio_intervalo_ms = 0;

/** Retoma la secuencia tras un reinicio sin escribir la flash en cada lectura. */
void cargarSecuencia() {
    preferencias.begin("monitor", false);
    secuencia = max<uint32_t>(1, preferencias.getUInt("seq", 1));
    secuencia_reservada = secuencia + config::BLOQUE_SECUENCIA;
    preferencias.putUInt("seq", secuencia_reservada);
}

uint32_t siguienteSecuencia() {
    const uint32_t s = secuencia++;
    if (secuencia >= secuencia_reservada) {
        secuencia_reservada += config::BLOQUE_SECUENCIA;
        preferencias.putUInt("seq", secuencia_reservada);
    }
    return s;
}

void cerrarIntervalo(uint32_t ahora_ms) {
    const float intervalo_s = (ahora_ms - inicio_intervalo_ms) / 1000.0f;
    const medicion::Lectura l{siguienteSecuencia(), intervalo.irms(), intervalo_s, api.epochActual()};
    if (!cola.agregar(l)) {
        Serial.println("[buf] búfer lleno: se descartó la lectura más antigua");
    }
    Serial.printf("Irms=%.3f A  P_est=%.1f W\n", l.irms_a, l.irms_a * config::V_REF_V);
    intervalo.reiniciar();
    inicio_intervalo_ms = ahora_ms;
}

}  // namespace

void setup() {
    Serial.begin(115200);
    delay(200);
    Serial.println();
    Serial.println("Monitor de energía — Irms medido; P_est estimada (220 V, FP = 1)");
#ifdef SIMULACION
    Serial.println("Modo SIMULACION (Wokwi)");
#endif
    cargarSecuencia();
    medidor.iniciar();
    api.iniciar();
    ultima_medicion_ms = inicio_intervalo_ms = millis();
}

void loop() {
    const uint32_t ahora = millis();
    api.mantener(ahora);

    if (ahora - ultima_medicion_ms >= config::MEDICION_CADA_MS) {
        ultima_medicion_ms = ahora;
        intervalo.agregar(medidor.medirVentana());
        if (medidor.ultimasSaturadas() > 0) {
            Serial.printf("[adc] %lu de %u muestras fuera de 150–2450 mV (offset %.0f mV)\n",
                          static_cast<unsigned long>(medidor.ultimasSaturadas()),
                          static_cast<unsigned>(medidor.ultimasMuestras()), medidor.ultimoOffsetMv());
        }
    }

    const uint32_t ahora_post = millis();
    if (ahora_post - inicio_intervalo_ms >= config::INTERVALO_ENVIO_S * 1000UL && intervalo.ventanas() > 0) {
        cerrarIntervalo(ahora_post);
    }

    api.intentarEnvio(cola, millis());
}
