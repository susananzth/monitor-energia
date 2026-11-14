package com.monitorenergia.servicio;

import com.monitorenergia.dominio.LecturaReferencia;
import com.monitorenergia.repositorio.LecturaRepository;
import com.monitorenergia.repositorio.ReferenciaRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Validación del prototipo contra la pinza amperimétrica. */
@Service
public class ReferenciaService {

    public record Validacion(List<LecturaReferencia> filas, double errorMedioAbsoluto, double errorMedioPorcentual) {}

    private final ReferenciaRepository referencias;
    private final LecturaRepository lecturas;
    private final SesionService sesiones;
    private final Clock reloj;

    public ReferenciaService(ReferenciaRepository referencias, LecturaRepository lecturas,
                             SesionService sesiones, Clock reloj) {
        this.referencias = referencias;
        this.lecturas = lecturas;
        this.sesiones = sesiones;
        this.reloj = reloj;
    }

    /**
     * Registra una lectura de la pinza. Si no se indica {@code iPrototipo}, se toma la
     * última lectura del prototipo anterior o igual al momento indicado.
     */
    @Transactional
    public LecturaReferencia registrar(Long sesionId, Instant marcaTiempo, double iPinza, Double iPrototipo) {
        sesiones.obtener(sesionId);
        Instant momento = marcaTiempo != null ? marcaTiempo : reloj.instant();
        double proto = iPrototipo != null ? iPrototipo
                : lecturas.findUltimaHasta(sesionId, momento)
                        .orElseThrow(() -> new NoEncontradoException(
                                "No hay lecturas del prototipo para comparar; indica i_prototipo"))
                        .getIRms();
        double abs = Math.abs(proto - iPinza);
        double pct = CalculoEnergia.diferenciaPorcentual(iPinza, proto);
        return referencias.save(new LecturaReferencia(sesionId, momento, iPinza, proto, abs, pct));
    }

    @Transactional(readOnly = true)
    public Validacion validacion(Long sesionId) {
        sesiones.obtener(sesionId);
        List<LecturaReferencia> filas = referencias.findBySesionIdOrderByMarcaTiempoAsc(sesionId);
        double mae = filas.stream().mapToDouble(LecturaReferencia::getDiferenciaAbs).average().orElse(0.0);
        double mape = filas.stream().mapToDouble(LecturaReferencia::getDiferenciaPct).average().orElse(0.0);
        return new Validacion(filas, mae, mape);
    }
}
