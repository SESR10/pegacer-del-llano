package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Waste;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WasteRepository extends JpaRepository<Waste, Long> {
    @EntityGraph(attributePaths = {"product", "product.unit", "batch", "user"})
    Page<Waste> findAllByOrderByRecordedAtDesc(Pageable pageable);
}
