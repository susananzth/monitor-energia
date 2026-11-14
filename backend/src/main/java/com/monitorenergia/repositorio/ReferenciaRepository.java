package com.monitorenergia.repositorio;

import com.monitorenergia.dominio.LecturaReferencia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferenciaRepository extends JpaRepository<LecturaReferencia, Long> {
    List<LecturaReferencia> findBySesionIdOrderByMarcaTiempoAsc(Long sesionId);
}
