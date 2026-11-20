package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Dispatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DispatchRepository extends JpaRepository<Dispatch, Long> {
    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    Page<Dispatch> findAllByOrderByDispatchedAtDesc(Pageable pageable);
}
