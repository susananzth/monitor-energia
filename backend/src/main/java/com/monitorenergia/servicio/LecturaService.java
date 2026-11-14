package com.monitorenergia.servicio;

import com.monitorenergia.dominio.Dispositivo;
import com.monitorenergia.dominio.Lectura;
import com.monitorenergia.dominio.SesionMedicion;
import com.monitorenergia.repositorio.LecturaRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ingesta desde el ESP32. El backend recalcula potencia y energía: no confía en el firmware.
 */
@Service
public class LecturaService {

    /** Lectura cruda tal como la envía el dispositivo. */
    public record LecturaEntrante(long secuencia, double iRms, double intervaloS, Instant timestamp) {}

    public record ResultadoIngesta(int aceptadas, int duplicadas) {}

    private final LecturaRepository lecturas;
    private final SesionService sesiones;
    private final Clock reloj;

    public LecturaService(LecturaRepository lecturas, SesionService sesiones, Clock reloj) {
        this.lecturas = lecturas;
        this.sesiones = sesiones;
        this.reloj = reloj;
    }

    /**
     * Guarda un lote en la sesión activa del dispositivo. Una secuencia repetida se ignora
     * (así el reintento del firmware es idempotente). La energía se acumula en orden de
     * secuencia a partir de la última lectura guardada.
     */
    @Transactional
    public ResultadoIngesta ingestar(Dispositivo dispositivo, List<LecturaEntrante> lote) {
        SesionMedicion sesion = sesiones.activaDe(dispositivo.getId());
        Instant ahora = reloj.instant();

        double acumulada = lecturas.findFirstBySesionIdOrderByIdDesc(sesion.getId())
                .map(Lectura::getEnergiaAcumuladaKwh).orElse(0.0);

        int aceptadas = 0;
        int duplicadas = 0;
        List<LecturaEntrante> ordenado = lote.stream()
                .sorted(Comparator.comparingLong(LecturaEntrante::secuencia)).toList();

        for (LecturaEntrante e : ordenado) {
            if (lecturas.existsBySesionIdAndSecuencia(sesion.getId(), e.secuencia())) {
                duplicadas++;
                continue;
            }
            double p = CalculoEnergia.potenciaEstimada(sesion.getVRef(), sesion.getFactorPotenciaSupuesto(), e.iRms());
            acumulada += CalculoEnergia.incrementoKwh(p, e.intervaloS());
            lecturas.save(new Lectura(sesion.getId(), e.timestamp(), ahora, e.iRms(), p,
                    e.intervaloS(), acumulada, e.secuencia()));
            aceptadas++;
        }
        return new ResultadoIngesta(aceptadas, duplicadas);
    }
}
