package com.monitorenergia.dominio;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String usuario;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    protected Usuario() {}

    public Usuario(String usuario, String nombre, String passwordHash, Rol rol, Instant creadoEn) {
        this.usuario = usuario;
        this.nombre = nombre;
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.creadoEn = creadoEn;
    }

    public Long getId() { return id; }
    public String getUsuario() { return usuario; }
    public String getNombre() { return nombre; }
    public String getPasswordHash() { return passwordHash; }
    public Rol getRol() { return rol; }
    public boolean isActivo() { return activo; }
    public Instant getCreadoEn() { return creadoEn; }

    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setRol(Rol rol) { this.rol = rol; }
    public void setActivo(boolean activo) { this.activo = activo; }
}
