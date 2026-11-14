package com.monitorenergia.repositorio;

import com.monitorenergia.dominio.Lectura;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LecturaRepository extends JpaRepository<Lectura, Long> {

    boolean existsBySesionIdAndSecuencia(Long sesionId, long secuencia);

    Optional<Lectura> findFirstBySesionIdOrderByIdDesc(Long sesionId);

    /** Lectura más cercana (hacia atrás) a un momento dado, para comparar con la pinza. */
    @Query("""
            select l from Lectura l
            where l.sesionId = :sesionId
              and coalesce(l.timestampDispositivo, l.timestampServidor) <= :momento
            order by coalesce(l.timestampDispositivo, l.timestampServidor) desc, l.id desc
            limit 1
            """)
    Optional<Lectura> findUltimaHasta(@Param("sesionId") Long sesionId, @Param("momento") Instant momento);

    @Query("""
            select l from Lectura l
            where l.sesionId = :sesionId
              and coalesce(l.timestampDispositivo, l.timestampServidor) between :desde and :hasta
            order by coalesce(l.timestampDispositivo, l.timestampServidor) asc, l.id asc
            """)
    List<Lectura> findSerie(@Param("sesionId") Long sesionId,
                            @Param("desde") Instant desde,
                            @Param("hasta") Instant hasta);

    @Query("""
            select count(l), avg(l.iRms), max(l.iRms), min(l.secuencia), max(l.secuencia)
            from Lectura l where l.sesionId = :sesionId
            """)
    List<Object[]> estadisticas(@Param("sesionId") Long sesionId);
}
