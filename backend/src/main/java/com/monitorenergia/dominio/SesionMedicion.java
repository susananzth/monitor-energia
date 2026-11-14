package com.monitorenergia.dominio;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sesion_medicion")
public class SesionMedicion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispositivo_id", nullable = false)
    private Long dispositivoId;

    @Column(name = "carga_declarada", nullable = false)
    private String cargaDeclarada;

    @Column(name = "v_ref", nullable = false)
    private double vRef;

    @Column(name = "factor_potencia_supuesto", nullable = false)
    private double factorPotenciaSupuesto;

    @Column(nullable = false)
    private Instant inicio;

    private Instant fin;

    private String notas;

    protected SesionMedicion() {}

    public SesionMedicion(Long dispositivoId, String cargaDeclarada, double vRef,
                          double factorPotenciaSupuesto, Instant inicio, String notas) {
        this.dispositivoId = dispositivoId;
        this.cargaDeclarada = cargaDeclarada;
        this.vRef = vRef;
        this.factorPotenciaSupuesto = factorPotenciaSupuesto;
        this.inicio = inicio;
        this.notas = notas;
    }

    public boolean estaActiva() { return fin == null; }
    public void finalizar(Instant momento) { this.fin = momento; }

    public Long getId() { return id; }
    public Long getDispositivoId() { return dispositivoId; }
    public String getCargaDeclarada() { return cargaDeclarada; }
    public double getVRef() { return vRef; }
    public double getFactorPotenciaSupuesto() { return factorPotenciaSupuesto; }
    public Instant getInicio() { return inicio; }
    public Instant getFin() { return fin; }
    public String getNotas() { return notas; }
}
