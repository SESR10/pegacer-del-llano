package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByCodeIgnoreCase(String code);

    @Query("""
        SELECT p FROM Product p
        WHERE (:category IS NULL OR p.category.code = :category)
          AND (:includeInactive = TRUE OR p.active = TRUE)
        ORDER BY p.category.id, p.code""")
    List<Product> search(@Param("category") String category, @Param("includeInactive") boolean includeInactive);

    /** Bloquea la fila mientras se registra un movimiento, para que dos usuarios no descuenten el mismo stock. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
