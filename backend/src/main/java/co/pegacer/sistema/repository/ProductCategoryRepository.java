package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Short> {
    Optional<ProductCategory> findByCode(String code);
}
