#pragma once
// Búfer circular de lecturas pendientes de envío. Si se llena, descarta la más antigua.

#include <cstddef>
#include <cstdint>

namespace medicion {

struct Lectura {
    uint32_t secuencia;
    float irms_a;
    float intervalo_s;
    int64_t epoch_s;  // 0 si aún no hay hora NTP
};

template <std::size_t Capacidad>
class ColaLecturas {
    static_assert(Capacidad > 0, "La capacidad debe ser > 0");

public:
    /** Agrega al final. Devuelve false si tuvo que descartar la más antigua. */
    bool agregar(const Lectura& l) {
        bool sin_descarte = true;
        if (tamano_ == Capacidad) {
            inicio_ = (inicio_ + 1) % Capacidad;
            --tamano_;
            ++descartadas_;
            sin_descarte = false;
        }
        datos_[(inicio_ + tamano_) % Capacidad] = l;
        ++tamano_;
        return sin_descarte;
    }

    /** i-ésima lectura desde la más antigua (0 = la primera). */
    const Lectura& en(std::size_t i) const { return datos_[(inicio_ + i) % Capacidad]; }

    /** Quita las n más antiguas (tras un envío exitoso). */
    void quitar(std::size_t n) {
        if (n > tamano_) n = tamano_;
        inicio_ = (inicio_ + n) % Capacidad;
        tamano_ -= n;
    }

    std::size_t tamano() const { return tamano_; }
    bool vacia() const { return tamano_ == 0; }
    static constexpr std::size_t capacidad() { return Capacidad; }
    uint32_t descartadas() const { return descartadas_; }

private:
    Lectura datos_[Capacidad] = {};
    std::size_t inicio_ = 0;
    std::size_t tamano_ = 0;
    uint32_t descartadas_ = 0;
};

}  // namespace medicion
