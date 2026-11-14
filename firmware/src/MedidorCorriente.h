#pragma once

#include <Arduino.h>

#include "calculo_irms.h"

/** Muestrea el ADC durante una ventana y calcula Irms con la librería pura `medicion`. */
class MedidorCorriente {
public:
    MedidorCorriente(uint8_t pin, const medicion::ParametrosTc& parametros, uint32_t ventana_ms,
                     float adc_min_mv, float adc_max_mv);

    void iniciar();

    /** Bloquea durante la ventana y devuelve Irms (A). */
    float medirVentana();

    size_t ultimasMuestras() const { return ventana_.muestras(); }
    float ultimoOffsetMv() const { return ventana_.offsetMv(); }
    /** Muestras fuera del rango confiable del ADC en la última ventana. */
    uint32_t ultimasSaturadas() const { return saturadas_; }

private:
    uint8_t pin_;
    medicion::ParametrosTc parametros_;
    uint32_t ventana_ms_;
    float adc_min_mv_;
    float adc_max_mv_;
    medicion::VentanaRms ventana_;
    uint32_t saturadas_ = 0;
};
