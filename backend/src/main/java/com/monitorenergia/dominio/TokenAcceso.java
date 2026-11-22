package com.monitorenergia.dominio;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "token_acceso")
public class TokenAcceso {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;

    protected TokenAcceso() {}

    public TokenAcceso(Usuario usuario, String tokenHash, Instant creadoEn, Instant expiraEn) {
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.creadoEn = creadoEn;
        this.expiraEn = expiraEn;
    }

    public Usuario getUsuario() { return usuario; }
    public Instant getExpiraEn() { return expiraEn; }
}
