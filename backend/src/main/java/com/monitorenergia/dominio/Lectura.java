package com.monitorenergia.dominio;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "lectura")
public class Lectura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sesion_id", nullable = false)
    private Long sesionId;

    @Column(name = "timestamp_dispositivo")
    private Instant timestampDispositivo;

    @Column(name = "timestamp_servidor", nullable = false)
    private Instant timestampServidor;

    @Column(name = "i_rms", nullable = false)
    private double iRms;

    @Column(name = "p_est", nullable = false)
    private double pEst;

    @Column(name = "intervalo_s", nullable = false)
    private double intervaloS;

    @Column(name = "energia_acumulada_kwh", nullable = false)
    private double energiaAcumuladaKwh;

    @Column(nullable = false)
    private long secuencia;

    protected Lectura() {}

    public Lectura(Long sesionId, Instant timestampDispositivo, Instant timestampServidor,
                   double iRms, double pEst, double intervaloS,
                   double energiaAcumuladaKwh, long secuencia) {
        this.sesionId = sesionId;
        this.timestampDispositivo = timestampDispositivo;
        this.timestampServidor = timestampServidor;
        this.iRms = iRms;
        this.pEst = pEst;
        this.intervaloS = intervaloS;
        this.energiaAcumuladaKwh = energiaAcumuladaKwh;
        this.secuencia = secuencia;
    }

    /** Momento efectivo de la lectura: el del dispositivo si lo informó, si no el del servidor. */
    public Instant momento() {
        return timestampDispositivo != null ? timestampDispositivo : timestampServidor;
    }

    public Long getId() { return id; }
    public Long getSesionId() { return sesionId; }
    public Instant getTimestampDispositivo() { return timestampDispositivo; }
    public Instant getTimestampServidor() { return timestampServidor; }
    public double getIRms() { return iRms; }
    public double getPEst() { return pEst; }
    public double getIntervaloS() { return intervaloS; }
    public double getEnergiaAcumuladaKwh() { return energiaAcumuladaKwh; }
    public long getSecuencia() { return secuencia; }
}
