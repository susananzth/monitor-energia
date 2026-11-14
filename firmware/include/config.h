#pragma once
// Parámetros del monitor. Todo es ajustable: se recalibrará con el hardware real.

#include <cstddef>
#include <cstdint>

#if __has_include("secrets.h")
#include "secrets.h"
#else
#warning "Falta include/secrets.h: se compila con secrets.example.h (cópialo y edítalo)"
#include "secrets.example.h"
#endif

namespace config {

// ---- Red ----
#ifdef SIMULACION
constexpr const char* WIFI_SSID_EFECTIVO = "Wokwi-GUEST";  // red abierta del simulador Wokwi
constexpr const char* WIFI_PASSWORD_EFECTIVO = "";
constexpr int32_t WIFI_CANAL = 6;  // Wokwi conecta más rápido en el canal 6
#else
constexpr const char* WIFI_SSID_EFECTIVO = WIFI_SSID;
constexpr const char* WIFI_PASSWORD_EFECTIVO = WIFI_PASSWORD;
constexpr int32_t WIFI_CANAL = 0;  // 0 = cualquiera
#endif

// ---- Pines ----
// Solo ADC1 (GPIO32–39): el ADC2 no se puede usar con Wi-Fi activo.
constexpr uint8_t PIN_ADC = 34;
static_assert(PIN_ADC >= 32 && PIN_ADC <= 39, "Usa un pin de ADC1 (GPIO32–39)");
constexpr uint8_t PIN_LED = 2;  // LED de estado: encendido = Wi-Fi conectado; parpadea al enviar

// ---- Acondicionamiento (SCT-013-000) ----
constexpr float R_B_OHM = 47.0f;    // resistencia de carga
constexpr float N_S = 2000.0f;      // relación 100 A : 50 mA
constexpr float K_CAL = 1.0f;       // factor de calibración (ver docs/calibracion.md)
constexpr float I_MIN_A = 0.05f;    // umbral de ruido: por debajo se reporta 0

// Rango confiable del ADC con atenuación de 11 dB (documentación de Espressif)
constexpr float ADC_MIN_MV = 150.0f;
constexpr float ADC_MAX_MV = 2450.0f;

// ---- Muestreo ----
constexpr uint32_t VENTANA_MS = 200;          // ≥ 10 ciclos de 60 Hz (12 ciclos)
constexpr uint32_t MEDICION_CADA_MS = 1000;   // una ventana por segundo
constexpr uint32_t INTERVALO_ENVIO_S = 5;     // una lectura (RMS de las ventanas) cada 5 s

// Solo para el monitor serial: el backend recalcula P_est y la energía.
constexpr float V_REF_V = 220.0f;

// ---- Envío ----
constexpr std::size_t CAPACIDAD_BUFFER = 720;  // 1 h de lecturas a 5 s sin conexión
constexpr std::size_t LOTE_MAX = 20;            // lecturas por POST
constexpr uint32_t BACKOFF_MIN_MS = 5000;
constexpr uint32_t BACKOFF_MAX_MS = 60000;
constexpr uint16_t HTTP_TIMEOUT_MS = 4000;
constexpr uint32_t CONSULTA_SESION_CADA_MS = 60000;

// La secuencia se reserva en bloques en la flash (NVS) para no repetirla tras un reinicio.
// Un reinicio deja como máximo este hueco en la secuencia.
constexpr uint32_t BLOQUE_SECUENCIA = 12;

}  // namespace config
