package com.monitorenergia.seguridad;

import com.monitorenergia.servicio.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Lee "Authorization: Bearer <token>" y, si es válido, autentica la petición. */
public class FiltroToken extends OncePerRequestFilter {

    private static final String PREFIJO = "Bearer ";

    private final AuthService auth;

    public FiltroToken(AuthService auth) {
        this.auth = auth;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain cadena)
            throws ServletException, IOException {
        String cabecera = req.getHeader(HttpHeaders.AUTHORIZATION);
        if (cabecera != null && cabecera.startsWith(PREFIJO)) {
            String token = cabecera.substring(PREFIJO.length()).trim();
            auth.autenticar(token).ifPresent(u -> {
                var principal = UsuarioAutenticado.de(u, token);
                var autoridades = List.of(new SimpleGrantedAuthority("ROLE_" + u.getRol().name()));
                SecurityContextHolder.getContext()
                        .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, autoridades));
            });
        }
        cadena.doFilter(req, res);
    }
}
