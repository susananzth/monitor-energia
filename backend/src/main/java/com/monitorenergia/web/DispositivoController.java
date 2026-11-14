package com.monitorenergia.web;

import com.monitorenergia.dominio.Dispositivo;
import com.monitorenergia.dominio.SesionMedicion;
import com.monitorenergia.servicio.DispositivoService;
import com.monitorenergia.servicio.NoAutorizadoException;
import com.monitorenergia.servicio.SesionService;
import com.monitorenergia.web.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dispositivos")
public class DispositivoController {

    private final DispositivoService dispositivos;
    private final SesionService sesiones;

    public DispositivoController(DispositivoService dispositivos, SesionService sesiones) {
        this.dispositivos = dispositivos;
        this.sesiones = sesiones;
    }

    /** Registra un dispositivo. La API key se devuelve una sola vez: guárdala. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DispositivoResponse registrar(@Valid @RequestBody DispositivoRequest req) {
        var creado = dispositivos.registrar(req.nombre());
        Dispositivo d = creado.dispositivo();
        return new DispositivoResponse(d.getId(), d.getNombre(), d.getCreadoEn(), creado.apiKey());
    }

    /** El ESP32 consulta a qué sesión debe enviar. Requiere su propia X-Device-Key. */
    @GetMapping("/{id}/sesion-activa")
    public SesionResponse sesionActiva(@PathVariable Long id,
                                       @RequestHeader(value = "X-Device-Key", required = false) String apiKey) {
        Dispositivo d = dispositivos.autenticar(apiKey);
        if (!d.getId().equals(id)) {
            throw new NoAutorizadoException("La API key no corresponde a este dispositivo");
        }
        SesionMedicion s = sesiones.activaDe(id);
        return SesionResponse.de(s);
    }
}
