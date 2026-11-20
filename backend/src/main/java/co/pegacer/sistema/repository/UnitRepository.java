package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UnitRepository extends JpaRepository<Unit, Short> {
    Optional<Unit> findByCode(String code);
}
