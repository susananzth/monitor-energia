// Chip personalizado de Wokwi que simula la salida acondicionada de un SCT-013-000.
//
//   V(t) = V_bias + (R_b / N_s) · √2 · I_rms · sin(2π · f · t)
//
// Atributos (en diagram.json): irms [A], vbias [V], rb [Ω], ns, freq [Hz].
// `irms` también se ajusta en vivo con el control deslizante del chip.

#include "wokwi-api.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#define PERIODO_ACTUALIZACION_US 100  // 10 kHz → ~166 puntos por ciclo de 60 Hz
#define V_MIN 0.0f
#define V_MAX 3.3f

typedef struct {
  pin_t out;
  uint32_t attr_irms;
  uint32_t attr_vbias;
  uint32_t attr_rb;
  uint32_t attr_ns;
  uint32_t attr_freq;
} chip_state_t;

static void actualizar_salida(void *user_data) {
  chip_state_t *chip = (chip_state_t *)user_data;
  const double t = get_sim_nanos() / 1e9;

  const float irms = attr_read_float(chip->attr_irms);
  const float vbias = attr_read_float(chip->attr_vbias);
  const float rb = attr_read_float(chip->attr_rb);
  const float ns = attr_read_float(chip->attr_ns);
  const float freq = attr_read_float(chip->attr_freq);

  const double amplitud = (ns > 0.0f) ? (rb / ns) * sqrt(2.0) * irms : 0.0;
  float v = (float)(vbias + amplitud * sin(2.0 * M_PI * freq * t));
  if (v < V_MIN) v = V_MIN;  // el pin no puede salir del rango de alimentación
  if (v > V_MAX) v = V_MAX;
  pin_dac_write(chip->out, v);
}

void chip_init(void) {
  chip_state_t *chip = malloc(sizeof(chip_state_t));
  chip->out = pin_init("OUT", ANALOG);
  pin_init("GND", INPUT);

  chip->attr_irms = attr_init_float("irms", 0.45f);
  chip->attr_vbias = attr_init_float("vbias", 1.32f);
  chip->attr_rb = attr_init_float("rb", 47.0f);
  chip->attr_ns = attr_init_float("ns", 2000.0f);
  chip->attr_freq = attr_init_float("freq", 60.0f);

  const timer_config_t config = {
    .callback = actualizar_salida,
    .user_data = chip,
  };
  timer_t timer = timer_init(&config);
  timer_start(timer, PERIODO_ACTUALIZACION_US, true);

  printf("ct-sim: Irms=%.3f A, Vbias=%.2f V, Rb=%.1f ohm, Ns=%.0f\n",
         attr_read_float(chip->attr_irms), attr_read_float(chip->attr_vbias),
         attr_read_float(chip->attr_rb), attr_read_float(chip->attr_ns));
}
