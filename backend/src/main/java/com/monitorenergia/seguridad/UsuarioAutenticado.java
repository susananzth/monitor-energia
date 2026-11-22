package com.monitorenergia.seguridad;

import com.monitorenergia.dominio.Rol;
import com.monitorenergia.dominio.Usuario;

/** Lo que el resto de la app sabe del usuario de la petición. */
public record UsuarioAutenticado(Long id, String usuario, String nombre, Rol rol, String token) {
    static UsuarioAutenticado de(Usuario u, String token) {
        return new UsuarioAutenticado(u.getId(), u.getUsuario(), u.getNombre(), u.getRol(), token);
    }
}
