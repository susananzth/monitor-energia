package com.monitorenergia.repositorio;

import com.monitorenergia.dominio.Rol;
import com.monitorenergia.dominio.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsuarioIgnoreCase(String usuario);
    boolean existsByUsuarioIgnoreCase(String usuario);
    long countByRolAndActivoTrue(Rol rol);
    List<Usuario> findAllByOrderByUsuarioAsc();
}
