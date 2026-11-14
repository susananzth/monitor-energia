#include "ClienteApi.h"

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <time.h>

namespace {
constexpr int64_t kEpochMinimoValido = 1700000000;  // 2023: si es menor, NTP aún no sincronizó
constexpr uint32_t kReintentoWifiMs = 10000;
}  // namespace

void ClienteApi::iniciar() {
    pinMode(config::PIN_LED, OUTPUT);
    digitalWrite(config::PIN_LED, LOW);
    // Laboratorio: no se verifica el certificado del túnel HTTPS. Para producción, usar setCACert().
    cliente_tls_.setInsecure();
    WiFi.mode(WIFI_STA);
    WiFi.begin(config::WIFI_SSID_EFECTIVO, config::WIFI_PASSWORD_EFECTIVO, config::WIFI_CANAL);
    Serial.printf("[wifi] conectando a %s...\n", config::WIFI_SSID_EFECTIVO);
}

void ClienteApi::mantener(uint32_t ahora_ms) {
    const bool ok = conectado();
    if (ok && !estaba_conectado_) {
        Serial.printf("[wifi] conectado, IP %s\n", WiFi.localIP().toString().c_str());
        if (!ntp_configurado_) {
            configTime(0, 0, "pool.ntp.org", "time.google.com");
            ntp_configurado_ = true;
        }
        consultarSesionActiva();
        ultima_consulta_sesion_ms_ = ahora_ms;
    } else if (!ok && estaba_conectado_) {
        Serial.println("[wifi] desconectado");
    }
    estaba_conectado_ = ok;

    if (!ok && ahora_ms - ultimo_intento_wifi_ms_ >= kReintentoWifiMs) {
        ultimo_intento_wifi_ms_ = ahora_ms;
        WiFi.reconnect();
    }
    if (ok && ahora_ms - ultima_consulta_sesion_ms_ >= config::CONSULTA_SESION_CADA_MS) {
        ultima_consulta_sesion_ms_ = ahora_ms;
        consultarSesionActiva();
    }
    // LED encendido con Wi-Fi; se apaga un instante tras cada envío exitoso.
    const bool parpadeo = static_cast<int32_t>(parpadeo_hasta_ms_ - ahora_ms) > 0;
    digitalWrite(config::PIN_LED, (ok && !parpadeo) ? HIGH : LOW);
}

int64_t ClienteApi::epochActual() const {
    const time_t t = time(nullptr);
    return t >= kEpochMinimoValido ? static_cast<int64_t>(t) : 0;
}

bool ClienteApi::comenzar(HTTPClient& http, const String& url) {
    http.setTimeout(config::HTTP_TIMEOUT_MS);
    if (url.startsWith("https://")) return http.begin(cliente_tls_, url);
    return http.begin(cliente_plano_, url);
}

String ClienteApi::cuerpoLote(const ColaLecturas& cola, size_t n) const {
    JsonDocument doc;
    JsonArray lecturas = doc["lecturas"].to<JsonArray>();
    for (size_t i = 0; i < n; ++i) {
        const medicion::Lectura& l = cola.en(i);
        JsonObject o = lecturas.add<JsonObject>();
        o["secuencia"] = l.secuencia;
        o["i_rms"] = serialized(String(l.irms_a, 4));
        o["intervalo_s"] = serialized(String(l.intervalo_s, 3));
        if (l.epoch_s > 0) o["timestamp"] = l.epoch_s;  // sin NTP se omite: el backend usa su hora
    }
    String cuerpo;
    serializeJson(doc, cuerpo);
    return cuerpo;
}

void ClienteApi::registrarFallo(uint32_t ahora_ms) {
    backoff_ms_ = backoff_ms_ == 0 ? config::BACKOFF_MIN_MS : min(backoff_ms_ * 2, config::BACKOFF_MAX_MS);
    proximo_envio_ms_ = ahora_ms + backoff_ms_;
    Serial.printf("[api] reintento en %lu s\n", static_cast<unsigned long>(backoff_ms_ / 1000));
}

void ClienteApi::intentarEnvio(ColaLecturas& cola, uint32_t ahora_ms) {
    if (cola.vacia() || !conectado()) return;
    if (static_cast<int32_t>(proximo_envio_ms_ - ahora_ms) > 0) return;

    const size_t n = min(cola.tamano(), config::LOTE_MAX);
    HTTPClient http;
    if (!comenzar(http, String(API_BASE_URL) + "/api/v1/lecturas")) {
        Serial.println("[api] URL inválida");
        registrarFallo(ahora_ms);
        return;
    }
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Key", DEVICE_API_KEY);
    const int codigo = http.POST(cuerpoLote(cola, n));
    http.end();

    if (codigo == 200 || codigo == 201) {
        cola.quitar(n);
        backoff_ms_ = 0;
        proximo_envio_ms_ = ahora_ms;
        parpadeo_hasta_ms_ = ahora_ms + 80;
        Serial.printf("[api] enviadas %u lecturas (pendientes %u)\n", static_cast<unsigned>(n),
                      static_cast<unsigned>(cola.tamano()));
    } else if (codigo == 404 || codigo == 400) {
        // 404: no hay sesión activa · 400: datos inválidos. Reintentar no lo arregla: se descartan.
        cola.quitar(n);
        proximo_envio_ms_ = ahora_ms + config::BACKOFF_MIN_MS;
        Serial.printf("[api] HTTP %d: se descartan %u lecturas (%s)\n", codigo, static_cast<unsigned>(n),
                      codigo == 404 ? "sin sesión activa" : "datos inválidos");
    } else {
        // 401 (API key), 5xx o error de red (<0): se conservan y se reintenta.
        Serial.printf("[api] error HTTP %d\n", codigo);
        registrarFallo(ahora_ms);
    }
}

void ClienteApi::consultarSesionActiva() {
    if (!conectado()) return;
    HTTPClient http;
    const String url = String(API_BASE_URL) + "/api/v1/dispositivos/" + String(DEVICE_ID) + "/sesion-activa";
    if (!comenzar(http, url)) return;
    http.addHeader("X-Device-Key", DEVICE_API_KEY);
    const int codigo = http.GET();
    if (codigo == 200) {
        JsonDocument doc;
        if (!deserializeJson(doc, http.getString())) {
            Serial.printf("[api] sesión activa %ld: %s\n", static_cast<long>(doc["id"] | 0L),
                          doc["carga_declarada"] | "?");
        }
    } else if (codigo == 404) {
        Serial.println("[api] sin sesión activa: inicia una desde la web");
    } else {
        Serial.printf("[api] no se pudo consultar la sesión (HTTP %d)\n", codigo);
    }
    http.end();
}
