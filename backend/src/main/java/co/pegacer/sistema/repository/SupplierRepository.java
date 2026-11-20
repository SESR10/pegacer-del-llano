package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    boolean existsByNitIgnoreCase(String nit);
    List<Supplier> findAllByOrderByNameAsc();
}
