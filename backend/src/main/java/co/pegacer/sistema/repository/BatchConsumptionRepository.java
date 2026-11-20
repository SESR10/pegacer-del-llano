package co.pegacer.sistema.repository;

import co.pegacer.sistema.entity.BatchConsumption;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface BatchConsumptionRepository extends JpaRepository<BatchConsumption, Long> {
    @EntityGraph(attributePaths = {"product"})
    List<BatchConsumption> findByBatchIdIn(Collection<Long> batchIds);
}
