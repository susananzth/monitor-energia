package com.monitorenergia.servicio;

import com.monitorenergia.dominio.Dispositivo;
import com.monitorenergia.repositorio.DispositivoRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.util.HexFormat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DispositivoService {

    public record DispositivoCreado(Dispositivo dispositivo, String apiKey) {}

    private final DispositivoRepository repositorio;
    private final Clock reloj;
    private final SecureRandom azar = new SecureRandom();

    public DispositivoService(DispositivoRepository repositorio, Clock reloj) {
        this.repositorio = repositorio;
        this.reloj = reloj;
    }

    /** Registra un dispositivo. La API key en claro solo se devuelve aquí, una vez. */
    @Transactional
    public DispositivoCreado registrar(String nombre) {
        byte[] bytes = new byte[32];
        azar.nextBytes(bytes);
        String apiKey = HexFormat.of().formatHex(bytes);
        Dispositivo d = repositorio.save(new Dispositivo(nombre, hash(apiKey), reloj.instant()));
        return new DispositivoCreado(d, apiKey);
    }

    @Transactional(readOnly = true)
    public Dispositivo autenticar(String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new NoAutorizadoException("Falta el encabezado X-Device-Key");
        }
        return repositorio.findByApiKeyHash(hash(apiKey))
                .orElseThrow(() -> new NoAutorizadoException("API key inválida"));
    }

    @Transactional(readOnly = true)
    public Dispositivo obtener(Long id) {
        return repositorio.findById(id)
                .orElseThrow(() -> new NoEncontradoException("Dispositivo " + id + " no existe"));
    }

    static String hash(String apiKey) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(apiKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
