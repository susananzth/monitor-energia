package com.monitorenergia.web;

import com.monitorenergia.servicio.ReferenciaService;
import com.monitorenergia.servicio.SesionService;
import com.monitorenergia.web.Dtos.*;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sesiones")
public class SesionController {

    private static final double V_REF_DEFECTO = 220.0;
    private static final double FP_DEFECTO = 1.0;

    private final SesionService sesiones;
    private final ReferenciaService referencias;

    public SesionController(SesionService sesiones, ReferenciaService referencias) {
        this.sesiones = sesiones;
        this.referencias = referencias;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SesionResponse iniciar(@Valid @RequestBody SesionRequest req) {
        return SesionResponse.de(sesiones.iniciar(req.dispositivoId(), req.cargaDeclarada(),
                req.vRef() != null ? req.vRef() : V_REF_DEFECTO,
                req.factorPotenciaSupuesto() != null ? req.factorPotenciaSupuesto() : FP_DEFECTO,
                req.notas()));
    }

    @PatchMapping("/{id}/finalizar")
    public SesionResponse finalizar(@PathVariable Long id) {
        return SesionResponse.de(sesiones.finalizar(id));
    }

    @GetMapping
    public Page<SesionResumenResponse> listar(@RequestParam(defaultValue = "0") int pagina,
                                              @RequestParam(defaultValue = "20") int tamano) {
        return sesiones.listar(PageRequest.of(Math.max(0, pagina), Math.min(Math.max(1, tamano), 100)))
                .map(SesionResumenResponse::de);
    }

    @GetMapping("/{id}")
    public SesionResumenResponse resumen(@PathVariable Long id) {
        return SesionResumenResponse.de(sesiones.resumen(id));
    }

    @GetMapping("/{id}/lecturas")
    public List<LecturaResponse> serie(@PathVariable Long id,
                                       @RequestParam(required = false) Instant desde,
                                       @RequestParam(required = false) Instant hasta) {
        return sesiones.serie(id, desde, hasta).stream().map(LecturaResponse::de).toList();
    }

    @GetMapping("/{id}/ultima")
    public LecturaResponse ultima(@PathVariable Long id) {
        return LecturaResponse.de(sesiones.ultima(id));
    }

    @PostMapping("/{id}/referencias")
    @ResponseStatus(HttpStatus.CREATED)
    public ReferenciaResponse registrarReferencia(@PathVariable Long id, @Valid @RequestBody ReferenciaRequest req) {
        return ReferenciaResponse.de(referencias.registrar(id, req.timestamp(), req.iPinza(), req.iPrototipo()));
    }

    @GetMapping("/{id}/validacion")
    public ValidacionResponse validacion(@PathVariable Long id) {
        return ValidacionResponse.de(referencias.validacion(id));
    }

    @GetMapping(value = "/{id}/export.csv", produces = "text/csv")
    public ResponseEntity<String> exportar(@PathVariable Long id) {
        var filas = sesiones.serie(id, null, null);
        StringBuilder csv = new StringBuilder(
                "secuencia,timestamp,i_rms_a,p_est_w,intervalo_s,energia_acumulada_kwh\n");
        for (var l : filas) {
            csv.append(String.format(Locale.ROOT, "%d,%s,%.4f,%.2f,%.3f,%.6f%n",
                    l.getSecuencia(), l.momento(), l.getIRms(), l.getPEst(),
                    l.getIntervaloS(), l.getEnergiaAcumuladaKwh()));
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sesion-" + id + ".csv\"")
                .body(csv.toString());
    }
}
