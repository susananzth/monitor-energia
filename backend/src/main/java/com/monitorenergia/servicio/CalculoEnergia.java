package com.monitorenergia.servicio;

/**
 * Fórmulas del marco teórico. Son estimaciones: no se mide la tensión ni el desfase.
 * <ul>
 *   <li>P_est = V_ref · I_rms · FP</li>
 *   <li>E_est = Σ (P_est · Δt_h) / 1000  [kWh]</li>
 * </ul>
 */
public final class CalculoEnergia {

    private CalculoEnergia() {}

    /** Potencia estimada en vatios. */
    public static double potenciaEstimada(double vRef, double factorPotencia, double iRms) {
        return vRef * iRms * factorPotencia;
    }

    /** Energía (kWh) consumida durante un intervalo a potencia constante. */
    public static double incrementoKwh(double potenciaW, double intervaloS) {
        double horas = intervaloS / 3600.0;
        return potenciaW * horas / 1000.0;
    }

    /**
     * Porcentaje de lecturas perdidas según la secuencia: se esperan
     * (max - min + 1) lecturas y llegaron {@code recibidas}.
     */
    public static double porcentajePerdida(long recibidas, long secuenciaMin, long secuenciaMax) {
        if (recibidas <= 0) {
            return 0.0;
        }
        long esperadas = secuenciaMax - secuenciaMin + 1;
        if (esperadas <= 0) {
            return 0.0;
        }
        long perdidas = Math.max(0, esperadas - recibidas);
        return 100.0 * perdidas / esperadas;
    }

    /** Diferencia porcentual respecto de la pinza (referencia). */
    public static double diferenciaPorcentual(double iPinza, double iPrototipo) {
        if (iPinza == 0.0) {
            return iPrototipo == 0.0 ? 0.0 : 100.0;
        }
        return Math.abs(iPrototipo - iPinza) / Math.abs(iPinza) * 100.0;
    }
}
