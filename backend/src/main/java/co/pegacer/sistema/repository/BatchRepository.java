package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Batch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    @EntityGraph(attributePaths = {"formula", "formula.product", "operator"})
    Page<Batch> findAllByOrderByProducedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"formula", "formula.product", "operator", "consumptions", "consumptions.product"})
    Optional<Batch> findWithDetailsById(Long id);
}
