package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Formula;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FormulaRepository extends JpaRepository<Formula, Long> {
    @EntityGraph(attributePaths = {"product", "items", "items.product"})
    List<Formula> findAllByOrderByIdAsc();

    @EntityGraph(attributePaths = {"product", "items", "items.product"})
    Optional<Formula> findWithItemsById(Long id);
}
