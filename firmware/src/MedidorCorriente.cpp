#include "MedidorCorriente.h"

#include <cmath>

#ifdef SIM_SOFTWARE
#include "config.h"
#endif

MedidorCorriente::MedidorCorriente(uint8_t pin, const medicion::ParametrosTc& parametros, uint32_t ventana_ms,
                                   float adc_min_mv, float adc_max_mv)
    : pin_(pin), parametros_(parametros), ventana_ms_(ventana_ms), adc_min_mv_(adc_min_mv), adc_max_mv_(adc_max_mv) {}

void MedidorCorriente::iniciar() {
    pinMode(pin_, INPUT);
    analogSetPinAttenuation(pin_, ADC_11db);  // rango ≈ 150–2450 mV
#ifdef SIM_SOFTWARE
    pinMode(config::PIN_POT_SIM, INPUT);
    analogSetPinAttenuation(config::PIN_POT_SIM, ADC_11db);
#endif
}

#ifdef SIM_SOFTWARE
float MedidorCorriente::irmsSimulada() const {
    return analogRead(config::PIN_POT_SIM) / 4095.0f * config::SIM_IRMS_MAX_A;
}
#endif

float MedidorCorriente::medirVentana() {
    ventana_.reiniciar();
    saturadas_ = 0;
#ifdef SIM_SOFTWARE
    const float irms_sim = irmsSimulada();
#endif
    const uint32_t inicio = micros();
    const uint32_t duracion_us = ventana_ms_ * 1000UL;
    while (micros() - inicio < duracion_us) {
#ifdef SIM_SOFTWARE
        // Plan B: misma fórmula que el chip ct-sim, cuantizada a mV como analogReadMilliVolts.
        const float mv = std::round(medicion::senalTcMv(micros() / 1e6, irms_sim, config::SIM_VBIAS_V,
                                                        parametros_.rb_ohm, parametros_.ns,
                                                        config::SIM_FRECUENCIA_HZ));
        delayMicroseconds(50);  // ritmo de muestreo parecido al del ADC real
#else
        // analogReadMilliVolts aplica la calibración de fábrica del ADC.
        const float mv = static_cast<float>(analogReadMilliVolts(pin_));
#endif
        if (mv < adc_min_mv_ || mv > adc_max_mv_) ++saturadas_;
        ventana_.agregar(mv);
    }
    return ventana_.irms(parametros_);
}
