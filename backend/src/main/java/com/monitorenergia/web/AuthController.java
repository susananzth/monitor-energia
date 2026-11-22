package com.monitorenergia.web;

import com.monitorenergia.seguridad.UsuarioAutenticado;
import com.monitorenergia.servicio.AuthService;
import com.monitorenergia.web.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        var acceso = auth.iniciarSesion(req.usuario(), req.password());
        return new LoginResponse(acceso.token(), acceso.expiraEn(), UsuarioResponse.de(acceso.usuario()));
    }

    @GetMapping("/yo")
    public YoResponse yo(@AuthenticationPrincipal UsuarioAutenticado u) {
        return new YoResponse(u.id(), u.usuario(), u.nombre(), u.rol());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal UsuarioAutenticado u) {
        auth.cerrarSesion(u.token());
    }

    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarPassword(@AuthenticationPrincipal UsuarioAutenticado u,
                                @Valid @RequestBody CambioPasswordRequest req) {
        auth.cambiarPassword(u.id(), req.actual(), req.nueva(), u.token());
    }
}
