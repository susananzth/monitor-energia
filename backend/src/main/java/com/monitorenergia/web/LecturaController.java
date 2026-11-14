package com.monitorenergia.web;

import com.monitorenergia.dominio.Dispositivo;
import com.monitorenergia.servicio.DispositivoService;
import com.monitorenergia.servicio.LecturaService;
import com.monitorenergia.servicio.LecturaService.LecturaEntrante;
import com.monitorenergia.web.Dtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/lecturas")
public class LecturaController {

    private final DispositivoService dispositivos;
    private final LecturaService lecturas;

    public LecturaController(DispositivoService dispositivos, LecturaService lecturas) {
        this.dispositivos = dispositivos;
        this.lecturas = lecturas;
    }

    /** Ingesta desde el ESP32 (lote de lecturas). Se autentica con X-Device-Key. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IngestaResponse ingestar(@RequestHeader(value = "X-Device-Key", required = false) String apiKey,
                                    @Valid @RequestBody LoteRequest lote) {
        Dispositivo d = dispositivos.autenticar(apiKey);
        var res = lecturas.ingestar(d, lote.lecturas().stream()
                .map(i -> new LecturaEntrante(i.secuencia(), i.iRms(), i.intervaloS(), i.timestamp()))
                .toList());
        return new IngestaResponse(res.aceptadas(), res.duplicadas());
    }
}
