#include "calculo_irms.h"

#include <cmath>

namespace medicion {

namespace {
constexpr double kPi = 3.14159265358979323846;
}

void VentanaRms::reiniciar() {
    n_ = 0;
    media_ = 0.0;
    m2_ = 0.0;
}

void VentanaRms::agregar(float milivoltios) {
    ++n_;
    const double delta = milivoltios - media_;
    media_ += delta / static_cast<double>(n_);
    m2_ += delta * (milivoltios - media_);
}

float VentanaRms::vrmsMv() const {
    if (n_ == 0) return 0.0f;
    return static_cast<float>(std::sqrt(m2_ / static_cast<double>(n_)));
}

float irmsDesdeVrms(float vrms_mv, const ParametrosTc& p) {
    if (p.rb_ohm <= 0.0f) return 0.0f;
    const float vrms_v = vrms_mv / 1000.0f;
    return (vrms_v / p.rb_ohm) * p.ns * p.k_cal;
}

float VentanaRms::irms(const ParametrosTc& p) const {
    const float i = irmsDesdeVrms(vrmsMv(), p);
    return i < p.i_min_a ? 0.0f : i;
}

float AcumuladorIntervalo::irms() const {
    if (n_ == 0) return 0.0f;
    return static_cast<float>(std::sqrt(suma_cuadrados_ / static_cast<double>(n_)));
}

float senalTcMv(double t_s, float irms_a, float vbias_v, float rb_ohm, float ns, float frecuencia_hz) {
    const double amplitud_v = (rb_ohm / ns) * std::sqrt(2.0) * irms_a;
    const double v = vbias_v + amplitud_v * std::sin(2.0 * kPi * frecuencia_hz * t_s);
    return static_cast<float>(v * 1000.0);
}

}  // namespace medicion
