package com.monitorenergia.servicio;

import com.monitorenergia.dominio.Lectura;
import com.monitorenergia.dominio.SesionMedicion;
import com.monitorenergia.repositorio.LecturaRepository;
import com.monitorenergia.repositorio.SesionRepository;
import java.time.Clock;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SesionService {

    public record Resumen(SesionMedicion sesion, long nLecturas, double iRmsPromedio, double iRmsMax,
                          double energiaKwh, double porcentajePerdida) {}

    private final SesionRepository sesiones;
    private final LecturaRepository lecturas;
    private final DispositivoService dispositivos;
    private final Clock reloj;

    public SesionService(SesionRepository sesiones, LecturaRepository lecturas,
                         DispositivoService dispositivos, Clock reloj) {
        this.sesiones = sesiones;
        this.lecturas = lecturas;
        this.dispositivos = dispositivos;
        this.reloj = reloj;
    }

    @Transactional
    public SesionMedicion iniciar(Long dispositivoId, String carga, double vRef,
                                  double factorPotencia, String notas) {
        dispositivos.obtener(dispositivoId);
        sesiones.findFirstByDispositivoIdAndFinIsNullOrderByInicioDesc(dispositivoId)
                .ifPresent(s -> {
                    throw new ConflictoException("El dispositivo ya tiene una sesión activa (id " + s.getId() + ")");
                });
        return sesiones.save(new SesionMedicion(dispositivoId, carga, vRef, factorPotencia, reloj.instant(), notas));
    }

    @Transactional
    public SesionMedicion finalizar(Long id) {
        SesionMedicion s = obtener(id);
        if (!s.estaActiva()) {
            throw new ConflictoException("La sesión " + id + " ya estaba finalizada");
        }
        s.finalizar(reloj.instant());
        return s;
    }

    @Transactional(readOnly = true)
    public SesionMedicion obtener(Long id) {
        return sesiones.findById(id)
                .orElseThrow(() -> new NoEncontradoException("Sesión " + id + " no existe"));
    }

    @Transactional(readOnly = true)
    public SesionMedicion activaDe(Long dispositivoId) {
        return sesiones.findFirstByDispositivoIdAndFinIsNullOrderByInicioDesc(dispositivoId)
                .orElseThrow(() -> new NoEncontradoException("El dispositivo " + dispositivoId + " no tiene sesión activa"));
    }

    @Transactional(readOnly = true)
    public Page<Resumen> listar(Pageable pageable) {
        return sesiones.findAllByOrderByInicioDesc(pageable).map(this::resumir);
    }

    @Transactional(readOnly = true)
    public Resumen resumen(Long id) {
        return resumir(obtener(id));
    }

    private Resumen resumir(SesionMedicion s) {
        Object[] fila = lecturas.estadisticas(s.getId()).get(0);
        long n = ((Number) fila[0]).longValue();
        if (n == 0) {
            return new Resumen(s, 0, 0, 0, 0, 0);
        }
        double promedio = ((Number) fila[1]).doubleValue();
        double maximo = ((Number) fila[2]).doubleValue();
        long secMin = ((Number) fila[3]).longValue();
        long secMax = ((Number) fila[4]).longValue();
        double energia = lecturas.findFirstBySesionIdOrderByIdDesc(s.getId())
                .map(Lectura::getEnergiaAcumuladaKwh).orElse(0.0);
        return new Resumen(s, n, promedio, maximo, energia,
                CalculoEnergia.porcentajePerdida(n, secMin, secMax));
    }

    @Transactional(readOnly = true)
    public List<Lectura> serie(Long sesionId, java.time.Instant desde, java.time.Instant hasta) {
        obtener(sesionId);
        return lecturas.findSerie(sesionId,
                desde != null ? desde : java.time.Instant.EPOCH,
                hasta != null ? hasta : java.time.Instant.parse("9999-12-31T23:59:59Z"));
    }

    @Transactional(readOnly = true)
    public Lectura ultima(Long sesionId) {
        obtener(sesionId);
        return lecturas.findFirstBySesionIdOrderByIdDesc(sesionId)
                .orElseThrow(() -> new NoEncontradoException("La sesión " + sesionId + " aún no tiene lecturas"));
    }
}
