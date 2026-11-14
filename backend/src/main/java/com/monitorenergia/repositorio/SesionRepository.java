package com.monitorenergia.repositorio;

import com.monitorenergia.dominio.SesionMedicion;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SesionRepository extends JpaRepository<SesionMedicion, Long> {
    Optional<SesionMedicion> findFirstByDispositivoIdAndFinIsNullOrderByInicioDesc(Long dispositivoId);

    Page<SesionMedicion> findAllByOrderByInicioDesc(Pageable pageable);
}
