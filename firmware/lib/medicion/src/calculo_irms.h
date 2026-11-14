#pragma once
// Cálculo puro de la corriente eficaz. No depende de Arduino: se prueba con `pio test -e native`.

#include <cstddef>
#include <cstdint>

namespace medicion {

/** Parámetros del acondicionamiento de señal. */
struct ParametrosTc {
    float rb_ohm;   // resistencia de carga R_b
    float ns;       // vueltas del secundario N_s (SCT-013-000: 2000)
    float k_cal;    // factor de calibración (1.0 por defecto)
    float i_min_a;  // umbral de ruido: por debajo se reporta 0
};

/**
 * Acumula muestras de una ventana (en mV) y calcula Irms.
 * Usa el algoritmo de Welford: la media (offset) y la varianza se calculan en una sola
 * pasada, sin guardar las muestras. El offset NO se asume (no se usa 1,32 V fijo).
 *
 *   V_rms  = sqrt( (1/n) · Σ (v_k − media)² )
 *   I_rms  = (V_rms / R_b) · N_s · K_cal
 */
class VentanaRms {
public:
    void reiniciar();
    void agregar(float milivoltios);

    std::size_t muestras() const { return n_; }
    float offsetMv() const { return static_cast<float>(media_); }
    float vrmsMv() const;
    /** Irms en amperios, aplicando el umbral de ruido. */
    float irms(const ParametrosTc& p) const;

private:
    std::size_t n_ = 0;
    double media_ = 0.0;
    double m2_ = 0.0;
};

/** Convierte V_rms (mV) en la resistencia de carga a I_rms del primario (A), sin umbral. */
float irmsDesdeVrms(float vrms_mv, const ParametrosTc& p);

/**
 * Combina varias ventanas de un intervalo de envío en un único Irms:
 * I = sqrt( media(I_k²) ), que conserva la energía del intervalo.
 */
class AcumuladorIntervalo {
public:
    void reiniciar() { suma_cuadrados_ = 0.0; n_ = 0; }
    void agregar(float irms_a) { suma_cuadrados_ += double(irms_a) * irms_a; ++n_; }
    std::size_t ventanas() const { return n_; }
    float irms() const;

private:
    double suma_cuadrados_ = 0.0;
    std::size_t n_ = 0;
};

/**
 * Señal que entrega el acondicionamiento ante una corriente senoidal (mV):
 *   V(t) = V_bias + (R_b / N_s) · √2 · I_rms · sin(2π f t)
 * Se usa en las pruebas y en el modo simulación.
 */
float senalTcMv(double t_s, float irms_a, float vbias_v, float rb_ohm, float ns, float frecuencia_hz);

}  // namespace medicion
