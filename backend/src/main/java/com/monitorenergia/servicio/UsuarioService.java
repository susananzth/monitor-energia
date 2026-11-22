package com.monitorenergia.servicio;

import com.monitorenergia.dominio.Rol;
import com.monitorenergia.dominio.Usuario;
import com.monitorenergia.repositorio.TokenAccesoRepository;
import com.monitorenergia.repositorio.UsuarioRepository;
import java.time.Clock;
import java.util.List;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestión de cuentas del equipo (solo administradores). */
@Service
public class UsuarioService {

    public static final int PASSWORD_MIN = 8;

    public record Cambios(String nombre, Rol rol, Boolean activo, String password) {}

    private final UsuarioRepository usuarios;
    private final TokenAccesoRepository tokens;
    private final PasswordEncoder encoder;
    private final Clock reloj;

    public UsuarioService(UsuarioRepository usuarios, TokenAccesoRepository tokens, PasswordEncoder encoder, Clock reloj) {
        this.usuarios = usuarios;
        this.tokens = tokens;
        this.encoder = encoder;
        this.reloj = reloj;
    }

    static void validarPassword(String password) {
        if (password == null || password.length() < PASSWORD_MIN) {
            throw new DatosInvalidosException("La contraseña debe tener al menos " + PASSWORD_MIN + " caracteres");
        }
    }

    @Transactional(readOnly = true)
    public List<Usuario> listar() {
        return usuarios.findAllByOrderByUsuarioAsc();
    }

    @Transactional
    public Usuario crear(String usuario, String nombre, String password, Rol rol) {
        String clave = usuario.trim().toLowerCase(Locale.ROOT);
        if (usuarios.existsByUsuarioIgnoreCase(clave)) {
            throw new ConflictoException("Ya existe el usuario " + clave);
        }
        validarPassword(password);
        return usuarios.save(new Usuario(clave, nombre.trim(), encoder.encode(password), rol, reloj.instant()));
    }

    @Transactional
    public Usuario actualizar(Long id, Cambios c, Long quienEdita) {
        Usuario u = usuarios.findById(id).orElseThrow(() -> new NoEncontradoException("Usuario " + id + " no existe"));
        boolean esSiMismo = u.getId().equals(quienEdita);
        boolean pierdeAdmin = (c.rol() != null && c.rol() != Rol.ADMIN) || Boolean.FALSE.equals(c.activo());
        if (esSiMismo && pierdeAdmin) {
            throw new ConflictoException("No puedes quitarte el rol de administrador ni desactivar tu propia cuenta");
        }
        if (u.getRol() == Rol.ADMIN && u.isActivo() && pierdeAdmin && usuarios.countByRolAndActivoTrue(Rol.ADMIN) <= 1) {
            throw new ConflictoException("Debe quedar al menos un administrador activo");
        }
        if (c.nombre() != null && !c.nombre().isBlank()) u.setNombre(c.nombre().trim());
        if (c.rol() != null) u.setRol(c.rol());
        if (c.activo() != null) u.setActivo(c.activo());
        if (c.password() != null) {
            validarPassword(c.password());
            u.setPasswordHash(encoder.encode(c.password()));
        }
        // Desactivar o cambiar la contraseña cierra todas las sesiones abiertas de ese usuario.
        if (Boolean.FALSE.equals(c.activo()) || c.password() != null) {
            tokens.borrarDeUsuario(u.getId());
        }
        return u;
    }
}
