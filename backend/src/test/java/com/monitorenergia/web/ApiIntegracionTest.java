package com.monitorenergia.web;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Description;
import org.hamcrest.Matcher;
import org.hamcrest.TypeSafeMatcher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegracionTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private record Dispositivo(long id, String apiKey) {}

    /** JSONPath puede devolver Double o BigDecimal; se compara por valor numérico. */
    private static Matcher<Number> cerca(double esperado, double tolerancia) {
        return new TypeSafeMatcher<>() {
            @Override protected boolean matchesSafely(Number n) {
                return Math.abs(n.doubleValue() - esperado) <= tolerancia;
            }
            @Override public void describeTo(Description d) {
                d.appendText("un número cercano a " + esperado);
            }
        };
    }

    private Dispositivo registrarDispositivo() throws Exception {
        String cuerpo = mvc.perform(post("/api/v1/dispositivos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"esp32-test\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.api_key", not(emptyOrNullString())))
                .andReturn().getResponse().getContentAsString();
        JsonNode n = json.readTree(cuerpo);
        return new Dispositivo(n.get("id").asLong(), n.get("api_key").asText());
    }

    private long iniciarSesion(long dispositivoId) throws Exception {
        String cuerpo = mvc.perform(post("/api/v1/sesiones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dispositivo_id\":" + dispositivoId + ",\"carga_declarada\":\"Foco 100 W\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.v_ref", is(220.0)))
                .andExpect(jsonPath("$.factor_potencia_supuesto", is(1.0)))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo).get("id").asLong();
    }

    private String lote(long desde, int cantidad, double iRms) {
        StringBuilder sb = new StringBuilder("{\"lecturas\":[");
        for (int i = 0; i < cantidad; i++) {
            if (i > 0) sb.append(',');
            sb.append("{\"secuencia\":").append(desde + i)
              .append(",\"i_rms\":").append(iRms).append(",\"intervalo_s\":5}");
        }
        return sb.append("]}").toString();
    }

    @Test
    void ingesta_conKeyInvalida_devuelve401() throws Exception {
        mvc.perform(post("/api/v1/lecturas").header("X-Device-Key", "clave-falsa")
                        .contentType(MediaType.APPLICATION_JSON).content(lote(1, 1, 0.5)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ingesta_sinKey_devuelve401() throws Exception {
        mvc.perform(post("/api/v1/lecturas")
                        .contentType(MediaType.APPLICATION_JSON).content(lote(1, 1, 0.5)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ingesta_sinSesionActiva_devuelve404() throws Exception {
        Dispositivo d = registrarDispositivo();
        mvc.perform(post("/api/v1/lecturas").header("X-Device-Key", d.apiKey())
                        .contentType(MediaType.APPLICATION_JSON).content(lote(1, 1, 0.5)))
                .andExpect(status().isNotFound());
    }

    @Test
    void ingesta_fueraDeRango_devuelve400() throws Exception {
        Dispositivo d = registrarDispositivo();
        iniciarSesion(d.id());
        mvc.perform(post("/api/v1/lecturas").header("X-Device-Key", d.apiKey())
                        .contentType(MediaType.APPLICATION_JSON).content(lote(1, 1, 150.0)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void flujoCompleto_ingestaCalculaEnergiaYResumen() throws Exception {
        Dispositivo d = registrarDispositivo();
        long sesion = iniciarSesion(d.id());

        // Una segunda sesión activa del mismo dispositivo no está permitida
        mvc.perform(post("/api/v1/sesiones").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dispositivo_id\":" + d.id() + ",\"carga_declarada\":\"Otra\"}"))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/v1/dispositivos/" + d.id() + "/sesion-activa").header("X-Device-Key", d.apiKey()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is((int) sesion)));

        // 10 lecturas de 0,5 A cada 5 s; se pierde la secuencia 5 (9 recibidas de 10 esperadas)
        String enviado = lote(1, 4, 0.5);
        mvc.perform(post("/api/v1/lecturas").header("X-Device-Key", d.apiKey())
                        .contentType(MediaType.APPLICATION_JSON).content(enviado))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.aceptadas", is(4)));
        mvc.perform(post("/api/v1/lecturas").header("X-Device-Key", d.apiKey())
                        .contentType(MediaType.APPLICATION_JSON).content(lote(6, 5, 0.5)))
                .andExpect(status().isCreated());

        // Reenviar el primer lote es idempotente
        mvc.perform(post("/api/v1/lecturas").header("X-Device-Key", d.apiKey())
                        .contentType(MediaType.APPLICATION_JSON).content(enviado))
                .andExpect(jsonPath("$.aceptadas", is(0)))
                .andExpect(jsonPath("$.duplicadas", is(4)));

        // P = 220 * 0,5 = 110 W; E = 110 W * (9*5 s) / 3600 / 1000 = 0,001375 kWh
        mvc.perform(get("/api/v1/sesiones/" + sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.n_lecturas", is(9)))
                .andExpect(jsonPath("$.i_rms_promedio", cerca(0.5, 1e-9)))
                .andExpect(jsonPath("$.i_rms_max", cerca(0.5, 1e-9)))
                .andExpect(jsonPath("$.energia_estimada_kwh", cerca(0.001375, 1e-9)))
                .andExpect(jsonPath("$.porcentaje_perdida", cerca(10.0, 1e-9)));

        mvc.perform(get("/api/v1/sesiones/" + sesion + "/ultima"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.p_est", cerca(110.0, 1e-9)))
                .andExpect(jsonPath("$.secuencia", is(10)));

        mvc.perform(get("/api/v1/sesiones/" + sesion + "/lecturas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(9)));

        mvc.perform(get("/api/v1/sesiones/" + sesion + "/export.csv"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("secuencia,timestamp,i_rms_a")));

        mvc.perform(get("/api/v1/sesiones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        mvc.perform(patch("/api/v1/sesiones/" + sesion + "/finalizar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activa", is(false)));
        mvc.perform(patch("/api/v1/sesiones/" + sesion + "/finalizar"))
                .andExpect(status().isConflict());
    }

    @Test
    void validacion_prototipoVsPinza_calculaErrores() throws Exception {
        Dispositivo d = registrarDispositivo();
        long sesion = iniciarSesion(d.id());

        // Pinza 10,0 A vs prototipo 10,3 A -> 3 %;  pinza 5,0 A vs 4,9 A -> 2 %
        mvc.perform(post("/api/v1/sesiones/" + sesion + "/referencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"i_pinza\":10.0,\"i_prototipo\":10.3}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.diferencia_pct", cerca(3.0, 1e-9)));
        mvc.perform(post("/api/v1/sesiones/" + sesion + "/referencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"i_pinza\":5.0,\"i_prototipo\":4.9}"))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/sesiones/" + sesion + "/validacion"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.filas", hasSize(2)))
                .andExpect(jsonPath("$.error_medio_absoluto_a", cerca(0.2, 1e-9)))
                .andExpect(jsonPath("$.error_medio_porcentual", cerca(2.5, 1e-9)));
    }

    @Test
    void validacion_sinPrototipoNiLecturas_devuelve404() throws Exception {
        Dispositivo d = registrarDispositivo();
        long sesion = iniciarSesion(d.id());
        mvc.perform(post("/api/v1/sesiones/" + sesion + "/referencias")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"i_pinza\":1.0}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void sesionInexistente_devuelve404() throws Exception {
        mvc.perform(get("/api/v1/sesiones/999999")).andExpect(status().isNotFound());
    }
}
