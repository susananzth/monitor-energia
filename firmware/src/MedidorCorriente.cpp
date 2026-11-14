#include "MedidorCorriente.h"

MedidorCorriente::MedidorCorriente(uint8_t pin, const medicion::ParametrosTc& parametros, uint32_t ventana_ms,
                                   float adc_min_mv, float adc_max_mv)
    : pin_(pin), parametros_(parametros), ventana_ms_(ventana_ms), adc_min_mv_(adc_min_mv), adc_max_mv_(adc_max_mv) {}

void MedidorCorriente::iniciar() {
    pinMode(pin_, INPUT);
    analogSetPinAttenuation(pin_, ADC_11db);  // rango ≈ 150–2450 mV
}

float MedidorCorriente::medirVentana() {
    ventana_.reiniciar();
    saturadas_ = 0;
    const uint32_t inicio = micros();
    const uint32_t duracion_us = ventana_ms_ * 1000UL;
    while (micros() - inicio < duracion_us) {
        // analogReadMilliVolts aplica la calibración de fábrica del ADC.
        const float mv = static_cast<float>(analogReadMilliVolts(pin_));
        if (mv < adc_min_mv_ || mv > adc_max_mv_) ++saturadas_;
        ventana_.agregar(mv);
    }
    return ventana_.irms(parametros_);
}
