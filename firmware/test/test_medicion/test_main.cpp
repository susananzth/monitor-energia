// Pruebas del cálculo de Irms con senoides sintéticas de amplitud conocida.
// Ejecutar: pio test -e native

#include <unity.h>

#include <cmath>
#include <cstdio>

#include "calculo_irms.h"
#include "cola_lecturas.h"

using namespace medicion;

namespace {

const ParametrosTc kTc{47.0f, 2000.0f, 1.0f, 0.05f};

/** Muestrea una ventana como lo haría el ESP32: mV enteros (analogReadMilliVolts). */
float medir(float irms_a, float vbias_v, float frecuencia_hz, float ventana_s = 0.2f,
            float muestreo_hz = 10000.0f, bool cuantizar = true) {
    VentanaRms v;
    const int n = static_cast<int>(ventana_s * muestreo_hz);
    for (int k = 0; k < n; ++k) {
        float mv = senalTcMv(k / double(muestreo_hz), irms_a, vbias_v, kTc.rb_ohm, kTc.ns, frecuencia_hz);
        if (cuantizar) mv = std::round(mv);
        v.agregar(mv);
    }
    return v.irms(kTc);
}

void verificarErrorMenorAl1pct(float esperado, float medido) {
    const float error_pct = std::fabs(medido - esperado) / esperado * 100.0f;
    char msg[96];
    snprintf(msg, sizeof msg, "esperado=%.4f A medido=%.4f A error=%.3f %%", esperado, medido, error_pct);
    TEST_ASSERT_TRUE_MESSAGE(error_pct < 1.0f, msg);
}

}  // namespace

void test_foco_100W_60Hz() { verificarErrorMenorAl1pct(0.4545f, medir(0.4545f, 1.32f, 60.0f)); }

void test_hervidor_60Hz() { verificarErrorMenorAl1pct(9.0f, medir(9.0f, 1.32f, 60.0f)); }

void test_corriente_alta_60Hz() { verificarErrorMenorAl1pct(30.0f, medir(30.0f, 1.32f, 60.0f)); }

void test_offset_distinto_de_1_32V() {
    // El offset se calcula de la ventana: un divisor real fuera de tolerancia no afecta.
    verificarErrorMenorAl1pct(5.0f, medir(5.0f, 1.40f, 60.0f));
    verificarErrorMenorAl1pct(5.0f, medir(5.0f, 1.25f, 60.0f));
}

void test_red_50Hz() { verificarErrorMenorAl1pct(5.0f, medir(5.0f, 1.32f, 50.0f)); }

void test_ventana_no_multiplo_de_ciclo() {
    // 210 ms = 12,6 ciclos de 60 Hz: el error por ciclo incompleto sigue < 1 %.
    verificarErrorMenorAl1pct(5.0f, medir(5.0f, 1.32f, 60.0f, 0.21f));
}

void test_offset_calculado() {
    VentanaRms v;
    for (int k = 0; k < 2000; ++k) v.agregar(senalTcMv(k / 10000.0, 3.0f, 1.32f, 47.0f, 2000.0f, 60.0f));
    TEST_ASSERT_FLOAT_WITHIN(0.5f, 1320.0f, v.offsetMv());
}

void test_sin_corriente_reporta_cero() { TEST_ASSERT_EQUAL_FLOAT(0.0f, medir(0.0f, 1.32f, 60.0f)); }

void test_bajo_el_umbral_reporta_cero() { TEST_ASSERT_EQUAL_FLOAT(0.0f, medir(0.03f, 1.32f, 60.0f, 0.2f, 10000.0f, false)); }

void test_k_cal_escala_el_resultado() {
    const ParametrosTc tc{47.0f, 2000.0f, 1.05f, 0.05f};
    TEST_ASSERT_FLOAT_WITHIN(1e-4f, 1.05f, irmsDesdeVrms(23.5f, tc));  // 23,5 mV / 47 Ω · 2000 = 1 A
}

void test_ventana_vacia() {
    VentanaRms v;
    TEST_ASSERT_EQUAL_FLOAT(0.0f, v.irms(kTc));
}

void test_acumulador_intervalo_conserva_energia() {
    AcumuladorIntervalo a;
    a.agregar(3.0f);
    a.agregar(4.0f);
    // sqrt((9 + 16) / 2) = 3,5355
    TEST_ASSERT_FLOAT_WITHIN(1e-4f, 3.5355f, a.irms());
    a.reiniciar();
    TEST_ASSERT_EQUAL_FLOAT(0.0f, a.irms());
}

void test_cola_fifo_y_quitar() {
    ColaLecturas<4> c;
    for (uint32_t s = 1; s <= 3; ++s) c.agregar({s, 1.0f, 5.0f, 0});
    TEST_ASSERT_EQUAL_UINT32(3, c.tamano());
    TEST_ASSERT_EQUAL_UINT32(1, c.en(0).secuencia);
    c.quitar(2);
    TEST_ASSERT_EQUAL_UINT32(1, c.tamano());
    TEST_ASSERT_EQUAL_UINT32(3, c.en(0).secuencia);
}

void test_cola_llena_descarta_la_mas_antigua() {
    ColaLecturas<3> c;
    for (uint32_t s = 1; s <= 3; ++s) TEST_ASSERT_TRUE(c.agregar({s, 1.0f, 5.0f, 0}));
    TEST_ASSERT_FALSE(c.agregar({4, 1.0f, 5.0f, 0}));
    TEST_ASSERT_EQUAL_UINT32(3, c.tamano());
    TEST_ASSERT_EQUAL_UINT32(2, c.en(0).secuencia);
    TEST_ASSERT_EQUAL_UINT32(4, c.en(2).secuencia);
    TEST_ASSERT_EQUAL_UINT32(1, c.descartadas());
}

void setUp() {}
void tearDown() {}

int main() {
    UNITY_BEGIN();
    RUN_TEST(test_foco_100W_60Hz);
    RUN_TEST(test_hervidor_60Hz);
    RUN_TEST(test_corriente_alta_60Hz);
    RUN_TEST(test_offset_distinto_de_1_32V);
    RUN_TEST(test_red_50Hz);
    RUN_TEST(test_ventana_no_multiplo_de_ciclo);
    RUN_TEST(test_offset_calculado);
    RUN_TEST(test_sin_corriente_reporta_cero);
    RUN_TEST(test_bajo_el_umbral_reporta_cero);
    RUN_TEST(test_k_cal_escala_el_resultado);
    RUN_TEST(test_ventana_vacia);
    RUN_TEST(test_acumulador_intervalo_conserva_energia);
    RUN_TEST(test_cola_fifo_y_quitar);
    RUN_TEST(test_cola_llena_descarta_la_mas_antigua);
    return UNITY_END();
}
