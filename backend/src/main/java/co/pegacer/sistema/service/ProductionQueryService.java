package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.*;
import co.pegacer.sistema.entity.Batch;
import co.pegacer.sistema.entity.BatchConsumption;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Consultas de fórmulas, cochadas, compras, despachos y desperdicios.
 * Registrar cada uno de ellos se construye en su fase (9 a 12) sobre {@link InventoryService#register}.
 */
@Service
@Transactional(readOnly = true)
public class ProductionQueryService {
    private final FormulaRepository formulas;
    private final BatchRepository batches;
    private final BatchConsumptionRepository consumptions;
    private final PurchaseRepository purchases;
    private final DispatchRepository dispatches;
    private final WasteRepository waste;

    public ProductionQueryService(FormulaRepository formulas, BatchRepository batches,
                                  BatchConsumptionRepository consumptions, PurchaseRepository purchases,
                                  DispatchRepository dispatches, WasteRepository waste) {
        this.formulas = formulas;
        this.batches = batches;
        this.consumptions = consumptions;
        this.purchases = purchases;
        this.dispatches = dispatches;
        this.waste = waste;
    }

    public List<FormulaDto> formulas() {
        return formulas.findAllByOrderByIdAsc().stream().distinct().map(FormulaDto::of).toList();
    }

    public FormulaDto formula(Long id) {
        return formulas.findById(id).map(FormulaDto::of)
                .orElseThrow(() -> new BusinessException("La fórmula no existe.", HttpStatus.NOT_FOUND));
    }

    public PageDto<BatchDto> batches(int page, int size) {
        Page<Batch> result = batches.findAllByOrderByProducedAtDesc(PageRequest.of(page, size));
        Map<Long, List<BatchConsumption>> byBatch = consumptions
                .findByBatchIdIn(result.getContent().stream().map(Batch::getId).toList()).stream()
                .collect(Collectors.groupingBy(c -> c.getBatch().getId()));
        return PageDto.of(result, b -> BatchDto.of(b, byBatch.getOrDefault(b.getId(), List.of())));
    }

    public BatchDto batch(Long id) {
        Batch b = batches.findWithDetailsById(id)
                .orElseThrow(() -> new BusinessException("La cochada no existe.", HttpStatus.NOT_FOUND));
        return BatchDto.of(b, b.getConsumptions());
    }

    public PageDto<PurchaseDto> purchases(int page, int size) {
        return PageDto.of(purchases.findAllByOrderByPurchasedAtDesc(PageRequest.of(page, size)), PurchaseDto::of);
    }

    public PageDto<DispatchDto> dispatches(int page, int size) {
        return PageDto.of(dispatches.findAllByOrderByDispatchedAtDesc(PageRequest.of(page, size)), DispatchDto::of);
    }

    public PageDto<WasteDto> waste(int page, int size) {
        return PageDto.of(waste.findAllByOrderByRecordedAtDesc(PageRequest.of(page, size)), WasteDto::of);
    }
}
