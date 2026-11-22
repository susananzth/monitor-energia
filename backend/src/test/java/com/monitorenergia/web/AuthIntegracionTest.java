package com.monitorenergia.web;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegracionTest {

    // Definidos en src/test/resources/application.properties
    private static final String ADMIN = "admin";
    private static final String ADMIN_PASS = "admin-prueba-123";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private ResultActions login(String usuario, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("usuario", usuario, "password", password))));
    }

    private String token(String usuario, String password) throws Exception {
        String cuerpo = login(usuario, password).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo).get("token").asText();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static String nuevoNombre() {
        return "u" + UUID.randomUUID().toString().substring(0, 8);
    }

    /** Crea un usuario con el admin y devuelve su id. */
    private long crearUsuario(String adminToken, String usuario, String password, String rol) throws Exception {
        String cuerpo = mvc.perform(post("/api/v1/usuarios").header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + usuario + "\",\"nombre\":\"Persona\",\"password\":\"" + password
                                + "\",\"rol\":\"" + rol + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo).get("id").asLong();
    }

    @Test
    void sinToken_laApiDeGestionDevuelve401() throws Exception {
        mvc.perform(get("/api/v1/sesiones")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail", is("Inicia sesión para continuar.")));
        mvc.perform(get("/api/v1/sesiones").header("Authorization", "Bearer token-inventado"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rutasDelEsp32_siguenSinToken_yUsanSuPropiaKey() throws Exception {
        mvc.perform(post("/api/v1/lecturas").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecturas\":[{\"secuencia\":1,\"i_rms\":0.4,\"intervalo_s\":5}]}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail", is("Falta el encabezado X-Device-Key")));
        mvc.perform(get("/api/v1/dispositivos/1/sesion-activa").header("X-Device-Key", "falsa"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail", is("API key inválida")));
    }

    @Test
    void loginCorrecto_daToken_yYoDevuelveElUsuario() throws Exception {
        login(ADMIN, ADMIN_PASS).andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.rol", is("ADMIN")));
        String t = token(ADMIN, ADMIN_PASS);
        mvc.perform(get("/api/v1/auth/yo").header("Authorization", bearer(t)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario", is(ADMIN)))
                .andExpect(jsonPath("$.rol", is("ADMIN")));
        mvc.perform(get("/api/v1/sesiones").header("Authorization", bearer(t))).andExpect(status().isOk());
    }

    @Test
    void loginIncorrecto_devuelve401_sinDecirQueFallo() throws Exception {
        login(ADMIN, "mala-clave").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail", is("Usuario o contraseña incorrectos")));
        login("no-existe", "lo-que-sea").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail", is("Usuario o contraseña incorrectos")));
    }

    @Test
    void cincoFallos_bloqueanElUsuario() throws Exception {
        String admin = token(ADMIN, ADMIN_PASS);
        String u = nuevoNombre();
        crearUsuario(admin, u, "clave-correcta-1", "MIEMBRO");
        for (int i = 0; i < 5; i++) login(u, "clave-mala").andExpect(status().isUnauthorized());
        login(u, "clave-correcta-1").andExpect(status().isTooManyRequests());
    }

    @Test
    void miembro_puedeOperar_peroNoGestionarUsuariosNiDispositivos() throws Exception {
        String admin = token(ADMIN, ADMIN_PASS);
        String u = nuevoNombre();
        crearUsuario(admin, u, "clave-miembro-1", "MIEMBRO");
        String t = token(u, "clave-miembro-1");

        mvc.perform(get("/api/v1/sesiones").header("Authorization", bearer(t))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/usuarios").header("Authorization", bearer(t))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/dispositivos").header("Authorization", bearer(t))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nombre\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void logout_invalidaElToken() throws Exception {
        String t = token(ADMIN, ADMIN_PASS);
        mvc.perform(post("/api/v1/auth/logout").header("Authorization", bearer(t))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/yo").header("Authorization", bearer(t))).andExpect(status().isUnauthorized());
    }

    @Test
    void desactivarUsuario_cierraSusSesiones() throws Exception {
        String admin = token(ADMIN, ADMIN_PASS);
        String u = nuevoNombre();
        long id = crearUsuario(admin, u, "clave-temporal-1", "MIEMBRO");
        String t = token(u, "clave-temporal-1");

        mvc.perform(patch("/api/v1/usuarios/" + id).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"activo\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.activo", is(false)));
        mvc.perform(get("/api/v1/auth/yo").header("Authorization", bearer(t))).andExpect(status().isUnauthorized());
        login(u, "clave-temporal-1").andExpect(status().isUnauthorized());
    }

    @Test
    void adminNoPuedeDesactivarseNiQuitarseElRol() throws Exception {
        String admin = token(ADMIN, ADMIN_PASS);
        long miId = json.readTree(mvc.perform(get("/api/v1/auth/yo").header("Authorization", bearer(admin)))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(patch("/api/v1/usuarios/" + miId).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"activo\":false}"))
                .andExpect(status().isConflict());
        mvc.perform(patch("/api/v1/usuarios/" + miId).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rol\":\"MIEMBRO\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void validaciones_usuarioDuplicadoYContrasenaCorta() throws Exception {
        String admin = token(ADMIN, ADMIN_PASS);
        String u = nuevoNombre();
        crearUsuario(admin, u, "clave-valida-1", "MIEMBRO");
        mvc.perform(post("/api/v1/usuarios").header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + u.toUpperCase() + "\",\"nombre\":\"X\",\"password\":\"clave-valida-1\",\"rol\":\"MIEMBRO\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/usuarios").header("Authorization", bearer(admin)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + nuevoNombre() + "\",\"nombre\":\"X\",\"password\":\"corta\",\"rol\":\"MIEMBRO\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cambiarPassword_propia() throws Exception {
        String admin = token(ADMIN, ADMIN_PASS);
        String u = nuevoNombre();
        crearUsuario(admin, u, "clave-inicial-1", "MIEMBRO");
        String t = token(u, "clave-inicial-1");
        mvc.perform(patch("/api/v1/auth/password").header("Authorization", bearer(t)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"actual\":\"equivocada\",\"nueva\":\"clave-nueva-123\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/auth/password").header("Authorization", bearer(t)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"actual\":\"clave-inicial-1\",\"nueva\":\"clave-nueva-123\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/yo").header("Authorization", bearer(t))).andExpect(status().isOk());
        login(u, "clave-inicial-1").andExpect(status().isUnauthorized());
        login(u, "clave-nueva-123").andExpect(status().isOk());
    }
}
