package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Batch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    @EntityGraph(attributePaths = {"formula", "formula.product", "operator"})
    Page<Batch> findAllByOrderByProducedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"formula", "formula.product", "operator", "consumptions", "consumptions.product"})
    Optional<Batch> findWithDetailsById(Long id);

    /** Código más alto con el prefijo (los códigos tienen 4 dígitos, así que el orden de texto sirve). */
    @Query("select max(b.code) from Batch b where b.code like concat(:prefix, '%')")
    Optional<String> findMaxCodeWithPrefix(@Param("prefix") String prefix);
}
