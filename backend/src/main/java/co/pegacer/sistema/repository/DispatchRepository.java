package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Dispatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DispatchRepository extends JpaRepository<Dispatch, Long> {
    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    Page<Dispatch> findAllByOrderByDispatchedAtDesc(Pageable pageable);

    @Query("select max(d.code) from Dispatch d where d.code like concat(:prefix, '%')")
    Optional<String> findMaxCodeWithPrefix(@Param("prefix") String prefix);
}
