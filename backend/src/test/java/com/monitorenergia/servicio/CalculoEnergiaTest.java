package com.monitorenergia.servicio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

class CalculoEnergiaTest {

    @Test
    void potenciaEstimada_foco100W() {
        // 0,4545 A * 220 V ≈ 100 W
        assertThat(CalculoEnergia.potenciaEstimada(220, 1.0, 0.4545)).isCloseTo(100.0, within(0.01));
    }

    @Test
    void potenciaEstimada_aplicaFactorDePotencia() {
        assertThat(CalculoEnergia.potenciaEstimada(220, 0.8, 1.0)).isCloseTo(176.0, within(1e-9));
    }

    @Test
    void incrementoKwh_1000W_durante1Hora_es1kWh() {
        assertThat(CalculoEnergia.incrementoKwh(1000, 3600)).isCloseTo(1.0, within(1e-9));
    }

    @Test
    void incrementoKwh_100W_durante5s() {
        // 100 W * (5/3600) h / 1000 = 0,000138888... kWh
        assertThat(CalculoEnergia.incrementoKwh(100, 5)).isCloseTo(1.388889e-4, within(1e-9));
    }

    @Test
    void porcentajePerdida_sinPerdidas() {
        assertThat(CalculoEnergia.porcentajePerdida(100, 1, 100)).isZero();
    }

    @Test
    void porcentajePerdida_5DeCien() {
        assertThat(CalculoEnergia.porcentajePerdida(95, 1, 100)).isCloseTo(5.0, within(1e-9));
    }

    @Test
    void porcentajePerdida_sinLecturas() {
        assertThat(CalculoEnergia.porcentajePerdida(0, 0, 0)).isZero();
    }

    @Test
    void diferenciaPorcentual_respectoDeLaPinza() {
        assertThat(CalculoEnergia.diferenciaPorcentual(10.0, 10.3)).isCloseTo(3.0, within(1e-9));
        assertThat(CalculoEnergia.diferenciaPorcentual(10.0, 9.5)).isCloseTo(5.0, within(1e-9));
    }

    @Test
    void diferenciaPorcentual_pinzaEnCero() {
        assertThat(CalculoEnergia.diferenciaPorcentual(0.0, 0.0)).isZero();
        assertThat(CalculoEnergia.diferenciaPorcentual(0.0, 0.2)).isEqualTo(100.0);
    }
}
