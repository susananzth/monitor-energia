package com.monitorenergia.seguridad;

import com.monitorenergia.servicio.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Todo /api pide un usuario con sesión iniciada, salvo:
 * - el login,
 * - las dos rutas del ESP32, que se autentican con su propia X-Device-Key.
 * Gestionar usuarios y registrar dispositivos es solo para ADMIN.
 */
@Configuration
public class ConfiguracionSeguridad {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain cadenaSeguridad(HttpSecurity http, AuthService auth) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable) // sin cookies: el token va en el encabezado
                .cors(Customizer.withDefaults())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/lecturas").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/dispositivos/*/sesion-activa").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()
                        .requestMatchers("/api/v1/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/dispositivos").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) ->
                                problema(res, HttpServletResponse.SC_UNAUTHORIZED, "Inicia sesión para continuar."))
                        .accessDeniedHandler((req, res, ex) ->
                                problema(res, HttpServletResponse.SC_FORBIDDEN, "No tienes permiso para esta acción.")))
                .addFilterBefore(new FiltroToken(auth), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    private static void problema(HttpServletResponse res, int estado, String detalle) throws IOException {
        res.setStatus(estado);
        res.setContentType("application/problem+json");
        res.setCharacterEncoding("UTF-8");
        res.getWriter().write("{\"status\":" + estado + ",\"detail\":\"" + detalle + "\"}");
    }
}
