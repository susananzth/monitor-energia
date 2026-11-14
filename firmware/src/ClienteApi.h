#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#include "cola_lecturas.h"
#include "config.h"

using ColaLecturas = medicion::ColaLecturas<config::CAPACIDAD_BUFFER>;

/**
 * Conexión Wi-Fi, hora NTP y envío de lecturas al backend.
 * Las lecturas quedan en el búfer hasta que el backend las confirma; si falla,
 * se reintenta con backoff exponencial.
 */
class ClienteApi {
public:
    void iniciar();
    /** Reconecta Wi-Fi, sincroniza NTP y actualiza el LED. Llamar en cada loop. */
    void mantener(uint32_t ahora_ms);
    /** Envía un lote si toca (respeta el backoff). */
    void intentarEnvio(ColaLecturas& cola, uint32_t ahora_ms);
    /** Imprime la sesión activa del dispositivo (informativo). */
    void consultarSesionActiva();

    bool conectado() const { return WiFi.status() == WL_CONNECTED; }
    /** Hora Unix si NTP ya sincronizó; 0 si no. */
    int64_t epochActual() const;

private:
    bool comenzar(class HTTPClient& http, const String& url);
    String cuerpoLote(const ColaLecturas& cola, size_t n) const;
    void registrarFallo(uint32_t ahora_ms);

    WiFiClient cliente_plano_;
    WiFiClientSecure cliente_tls_;
    bool ntp_configurado_ = false;
    bool estaba_conectado_ = false;
    uint32_t ultimo_intento_wifi_ms_ = 0;
    uint32_t backoff_ms_ = 0;
    uint32_t proximo_envio_ms_ = 0;
    uint32_t parpadeo_hasta_ms_ = 0;
    uint32_t ultima_consulta_sesion_ms_ = 0;
};
