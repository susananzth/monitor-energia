package com.monitorenergia.dominio;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "dispositivo")
public class Dispositivo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "api_key_hash", nullable = false, unique = true)
    private String apiKeyHash;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    protected Dispositivo() {}

    public Dispositivo(String nombre, String apiKeyHash, Instant creadoEn) {
        this.nombre = nombre;
        this.apiKeyHash = apiKeyHash;
        this.creadoEn = creadoEn;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public Instant getCreadoEn() { return creadoEn; }
}
