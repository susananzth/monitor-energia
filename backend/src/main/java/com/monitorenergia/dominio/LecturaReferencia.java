package com.monitorenergia.dominio;

import jakarta.persistence.*;
import java.time.Instant;

/** Medición de la pinza amperimétrica comparada con la del prototipo. */
@Entity
@Table(name = "lectura_referencia")
public class LecturaReferencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sesion_id", nullable = false)
    private Long sesionId;

    @Column(name = "marca_tiempo", nullable = false)
    private Instant marcaTiempo;

    @Column(name = "i_pinza", nullable = false)
    private double iPinza;

    @Column(name = "i_prototipo", nullable = false)
    private double iPrototipo;

    @Column(name = "diferencia_abs", nullable = false)
    private double diferenciaAbs;

    @Column(name = "diferencia_pct", nullable = false)
    private double diferenciaPct;

    protected LecturaReferencia() {}

    public LecturaReferencia(Long sesionId, Instant marcaTiempo, double iPinza, double iPrototipo,
                             double diferenciaAbs, double diferenciaPct) {
        this.sesionId = sesionId;
        this.marcaTiempo = marcaTiempo;
        this.iPinza = iPinza;
        this.iPrototipo = iPrototipo;
        this.diferenciaAbs = diferenciaAbs;
        this.diferenciaPct = diferenciaPct;
    }

    public Long getId() { return id; }
    public Long getSesionId() { return sesionId; }
    public Instant getMarcaTiempo() { return marcaTiempo; }
    public double getIPinza() { return iPinza; }
    public double getIPrototipo() { return iPrototipo; }
    public double getDiferenciaAbs() { return diferenciaAbs; }
    public double getDiferenciaPct() { return diferenciaPct; }
}
