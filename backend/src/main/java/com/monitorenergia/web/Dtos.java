package com.monitorenergia.web;

import com.monitorenergia.dominio.Lectura;
import com.monitorenergia.dominio.LecturaReferencia;
import com.monitorenergia.dominio.SesionMedicion;
import com.monitorenergia.servicio.ReferenciaService;
import com.monitorenergia.servicio.SesionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

/** DTOs de la API. En JSON se serializan en snake_case (i_rms, v_ref, ...). */
public final class Dtos {

    private Dtos() {}

    // ---- Dispositivos ----
    public record DispositivoRequest(@NotBlank @Size(max = 100) String nombre) {}

    public record DispositivoResponse(Long id, String nombre, Instant creadoEn, String apiKey) {}

    // ---- Sesiones ----
    public record SesionRequest(
            @NotNull Long dispositivoId,
            @NotBlank @Size(max = 200) String cargaDeclarada,
            @DecimalMin(value = "0.0", inclusive = false) Double vRef,
            @DecimalMin(value = "0.0", inclusive = false) @DecimalMax("1.0") Double factorPotenciaSupuesto,
            @Size(max = 1000) String notas) {}

    public record SesionResponse(Long id, Long dispositivoId, String cargaDeclarada, double vRef,
                                 double factorPotenciaSupuesto, Instant inicio, Instant fin, String notas,
                                 boolean activa) {
        static SesionResponse de(SesionMedicion s) {
            return new SesionResponse(s.getId(), s.getDispositivoId(), s.getCargaDeclarada(), s.getVRef(),
                    s.getFactorPotenciaSupuesto(), s.getInicio(), s.getFin(), s.getNotas(), s.estaActiva());
        }
    }

    /** Resumen de sesión. i_rms es medido; energia_estimada_kwh es estimada (V_ref y FP supuestos). */
    public record SesionResumenResponse(Long id, Long dispositivoId, String cargaDeclarada, double vRef,
                                        double factorPotenciaSupuesto, Instant inicio, Instant fin,
                                        boolean activa, long nLecturas, double iRmsPromedio, double iRmsMax,
                                        double energiaEstimadaKwh, double porcentajePerdida) {
        static SesionResumenResponse de(SesionService.Resumen r) {
            SesionMedicion s = r.sesion();
            return new SesionResumenResponse(s.getId(), s.getDispositivoId(), s.getCargaDeclarada(), s.getVRef(),
                    s.getFactorPotenciaSupuesto(), s.getInicio(), s.getFin(), s.estaActiva(), r.nLecturas(),
                    r.iRmsPromedio(), r.iRmsMax(), r.energiaKwh(), r.porcentajePerdida());
        }
    }

    // ---- Lecturas ----
    public record LecturaItem(
            @NotNull Long secuencia,
            @NotNull @DecimalMin("0.0") @DecimalMax("100.0") Double iRms,
            @NotNull @Positive Double intervaloS,
            Instant timestamp) {}

    public record LoteRequest(@NotEmpty @Size(max = 500) List<@Valid LecturaItem> lecturas) {}

    public record IngestaResponse(int aceptadas, int duplicadas) {}

    public record LecturaResponse(Long id, Long sesionId, Instant timestamp, double iRms, double pEst,
                                  double intervaloS, double energiaAcumuladaKwh, long secuencia) {
        static LecturaResponse de(Lectura l) {
            return new LecturaResponse(l.getId(), l.getSesionId(), l.momento(), l.getIRms(), l.getPEst(),
                    l.getIntervaloS(), l.getEnergiaAcumuladaKwh(), l.getSecuencia());
        }
    }

    // ---- Validación con pinza ----
    public record ReferenciaRequest(
            Instant timestamp,
            @NotNull @DecimalMin("0.0") Double iPinza,
            @DecimalMin("0.0") Double iPrototipo) {}

    public record ReferenciaResponse(Long id, Instant timestamp, double iPinza, double iPrototipo,
                                     double diferenciaAbs, double diferenciaPct) {
        static ReferenciaResponse de(LecturaReferencia r) {
            return new ReferenciaResponse(r.getId(), r.getMarcaTiempo(), r.getIPinza(), r.getIPrototipo(),
                    r.getDiferenciaAbs(), r.getDiferenciaPct());
        }
    }

    public record ValidacionResponse(List<ReferenciaResponse> filas, double errorMedioAbsolutoA,
                                     double errorMedioPorcentual) {
        static ValidacionResponse de(ReferenciaService.Validacion v) {
            return new ValidacionResponse(v.filas().stream().map(ReferenciaResponse::de).toList(),
                    v.errorMedioAbsoluto(), v.errorMedioPorcentual());
        }
    }
}
