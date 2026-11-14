package com.monitorenergia.repositorio;

import com.monitorenergia.dominio.Dispositivo;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DispositivoRepository extends JpaRepository<Dispositivo, Long> {
    Optional<Dispositivo> findByApiKeyHash(String apiKeyHash);
}
