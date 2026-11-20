package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    @EntityGraph(attributePaths = {"supplier", "user", "items", "items.product"})
    Page<Purchase> findAllByOrderByPurchasedAtDesc(Pageable pageable);
}
