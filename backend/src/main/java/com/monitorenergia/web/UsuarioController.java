package com.monitorenergia.web;

import com.monitorenergia.seguridad.UsuarioAutenticado;
import com.monitorenergia.servicio.UsuarioService;
import com.monitorenergia.web.Dtos.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Cuentas del equipo. Solo ADMIN (ver ConfiguracionSeguridad). */
@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService usuarios;

    public UsuarioController(UsuarioService usuarios) {
        this.usuarios = usuarios;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarios.listar().stream().map(UsuarioResponse::de).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crear(@Valid @RequestBody UsuarioRequest req) {
        return UsuarioResponse.de(usuarios.crear(req.usuario(), req.nombre(), req.password(), req.rol()));
    }

    @PatchMapping("/{id}")
    public UsuarioResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioCambiosRequest req,
                                      @AuthenticationPrincipal UsuarioAutenticado quien) {
        var cambios = new UsuarioService.Cambios(req.nombre(), req.rol(), req.activo(), req.password());
        return UsuarioResponse.de(usuarios.actualizar(id, cambios, quien.id()));
    }
}
