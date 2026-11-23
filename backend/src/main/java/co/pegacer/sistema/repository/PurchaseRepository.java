package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.Purchase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    @EntityGraph(attributePaths = {"supplier", "user", "items", "items.product"})
    Page<Purchase> findAllByOrderByPurchasedAtDesc(Pageable pageable);

    @Query("select max(p.code) from Purchase p where p.code like concat(:prefix, '%')")
    Optional<String> findMaxCodeWithPrefix(@Param("prefix") String prefix);

    boolean existsBySupplierIdAndInvoiceNumberIgnoreCase(Long supplierId, String invoiceNumber);
}
