package com.monitorenergia.servicio;

import com.monitorenergia.dominio.TokenAcceso;
import com.monitorenergia.dominio.Usuario;
import com.monitorenergia.repositorio.TokenAccesoRepository;
import com.monitorenergia.repositorio.UsuarioRepository;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Inicio de sesión con usuario y contraseña; emite tokens opacos que se guardan como hash. */
@Service
public class AuthService {

    public record Acceso(String token, Instant expiraEn, Usuario usuario) {}

    private record Fallos(int cantidad, Instant bloqueadoHasta) {}

    static final int MAX_FALLOS = 5;
    static final Duration BLOQUEO = Duration.ofMinutes(5);

    private final UsuarioRepository usuarios;
    private final TokenAccesoRepository tokens;
    private final PasswordEncoder encoder;
    private final Clock reloj;
    private final Duration duracionToken;
    private final SecureRandom azar = new SecureRandom();
    private final Map<String, Fallos> fallos = new ConcurrentHashMap<>();
    /** Hash de referencia para gastar el mismo tiempo cuando el usuario no existe. */
    private final String hashFicticio;

    public AuthService(UsuarioRepository usuarios, TokenAccesoRepository tokens, PasswordEncoder encoder, Clock reloj,
                       @Value("${app.auth.duracion-token-horas:12}") long horasToken) {
        this.usuarios = usuarios;
        this.tokens = tokens;
        this.encoder = encoder;
        this.reloj = reloj;
        this.duracionToken = Duration.ofHours(horasToken);
        this.hashFicticio = encoder.encode("contraseña-ficticia");
    }

    @Transactional
    public Acceso iniciarSesion(String nombreUsuario, String password) {
        String clave = nombreUsuario.trim().toLowerCase(Locale.ROOT);
        Instant ahora = reloj.instant();
        Fallos f = fallos.get(clave);
        if (f != null && f.bloqueadoHasta() != null && ahora.isBefore(f.bloqueadoHasta())) {
            throw new DemasiadosIntentosException("Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.");
        }

        Optional<Usuario> u = usuarios.findByUsuarioIgnoreCase(clave);
        boolean ok = encoder.matches(password, u.map(Usuario::getPasswordHash).orElse(hashFicticio))
                && u.isPresent() && u.get().isActivo();
        if (!ok) {
            registrarFallo(clave, ahora);
            throw new NoAutorizadoException("Usuario o contraseña incorrectos");
        }
        fallos.remove(clave);
        tokens.borrarExpirados(ahora);

        byte[] bytes = new byte[32];
        azar.nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);
        Instant expira = ahora.plus(duracionToken);
        tokens.save(new TokenAcceso(u.get(), DispositivoService.hash(token), ahora, expira));
        return new Acceso(token, expira, u.get());
    }

    /** Usuario dueño del token, si el token existe, no venció y el usuario sigue activo. */
    @Transactional(readOnly = true)
    public Optional<Usuario> autenticar(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return tokens.findByTokenHashAndExpiraEnAfter(DispositivoService.hash(token), reloj.instant())
                .map(TokenAcceso::getUsuario)
                .filter(Usuario::isActivo);
    }

    @Transactional
    public void cerrarSesion(String token) {
        if (token != null && !token.isBlank()) tokens.borrarPorHash(DispositivoService.hash(token));
    }

    @Transactional
    public void cambiarPassword(Long usuarioId, String actual, String nueva, String tokenActual) {
        Usuario u = usuarios.findById(usuarioId).orElseThrow(() -> new NoEncontradoException("Usuario no existe"));
        if (!encoder.matches(actual, u.getPasswordHash())) {
            throw new DatosInvalidosException("La contraseña actual no es correcta");
        }
        UsuarioService.validarPassword(nueva);
        u.setPasswordHash(encoder.encode(nueva));
        // Cierra las demás sesiones abiertas de este usuario; conserva la actual.
        tokens.borrarDeUsuario(usuarioId);
        Instant ahora = reloj.instant();
        tokens.save(new TokenAcceso(u, DispositivoService.hash(tokenActual), ahora, ahora.plus(duracionToken)));
    }

    private void registrarFallo(String clave, Instant ahora) {
        fallos.compute(clave, (k, previo) -> {
            int n = (previo == null || previo.bloqueadoHasta() != null) ? 1 : previo.cantidad() + 1;
            return n >= MAX_FALLOS ? new Fallos(n, ahora.plus(BLOQUEO)) : new Fallos(n, null);
        });
    }
}
