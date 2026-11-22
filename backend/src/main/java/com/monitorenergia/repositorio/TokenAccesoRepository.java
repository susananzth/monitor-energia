package com.monitorenergia.repositorio;

import com.monitorenergia.dominio.TokenAcceso;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface TokenAccesoRepository extends JpaRepository<TokenAcceso, Long> {
    Optional<TokenAcceso> findByTokenHashAndExpiraEnAfter(String tokenHash, Instant ahora);

    @Modifying
    @Query("delete from TokenAcceso t where t.tokenHash = :hash")
    int borrarPorHash(String hash);

    @Modifying
    @Query("delete from TokenAcceso t where t.usuario.id = :usuarioId")
    int borrarDeUsuario(Long usuarioId);

    @Modifying
    @Query("delete from TokenAcceso t where t.expiraEn <= :ahora")
    int borrarExpirados(Instant ahora);
}
