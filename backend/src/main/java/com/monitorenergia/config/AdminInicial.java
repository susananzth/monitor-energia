package com.monitorenergia.config;

import com.monitorenergia.dominio.Rol;
import com.monitorenergia.repositorio.UsuarioRepository;
import com.monitorenergia.servicio.UsuarioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Si no hay usuarios, crea el primer administrador con ADMIN_USUARIO y ADMIN_PASSWORD. */
@Component
public class AdminInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);

    private final UsuarioRepository usuarios;
    private final UsuarioService servicio;
    private final String usuario;
    private final String password;

    public AdminInicial(UsuarioRepository usuarios, UsuarioService servicio,
                        @Value("${app.admin.usuario:}") String usuario,
                        @Value("${app.admin.password:}") String password) {
        this.usuarios = usuarios;
        this.servicio = servicio;
        this.usuario = usuario;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (usuarios.count() > 0) return;
        if (usuario.isBlank() || password.isBlank()) {
            log.warn("No hay usuarios. Define ADMIN_USUARIO y ADMIN_PASSWORD para crear el primer administrador.");
            return;
        }
        servicio.crear(usuario, "Administrador", password, Rol.ADMIN);
        log.info("Administrador inicial '{}' creado.", usuario);
    }
}
