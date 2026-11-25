package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.*;
import co.pegacer.sistema.entity.*;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.*;
import co.pegacer.sistema.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.Year;
import java.util.*;

/**
 * Fase 11: capacidad de producción, despachos de producto terminado y desperdicios.
 * Las salidas pasan por {@link InventoryService#register}, que valida el stock y deja el kardex.
 */
@Service
public class OperationsService {
    private final FormulaRepository formulas;
    private final ProductRepository products;
    private final DispatchRepository dispatches;
    private final WasteRepository waste;
    private final BatchRepository batches;
    private final InventoryService inventory;
    private final AuditService audit;
    private final CurrentUser currentUser;

    public OperationsService(FormulaRepository formulas, ProductRepository products, DispatchRepository dispatches,
                             WasteRepository waste, BatchRepository batches, InventoryService inventory,
                             AuditService audit, CurrentUser currentUser) {
        this.formulas = formulas;
        this.products = products;
        this.dispatches = dispatches;
        this.waste = waste;
        this.batches = batches;
        this.inventory = inventory;
        this.audit = audit;
        this.currentUser = currentUser;
    }

    /** Para cada fórmula activa: cochadas posibles con el stock actual y el material que limita. */
    @Transactional(readOnly = true)
    public List<CapacityDto> capacity() {
        List<CapacityDto> out = new ArrayList<>();
        for (Formula f : formulas.findAllByOrderByIdAsc().stream().distinct().filter(Formula::isActive).toList()) {
            if (f.getItems().isEmpty()) continue;
            List<int[]> counts = new ArrayList<>();
            int min = Integer.MAX_VALUE;
            for (FormulaItem i : f.getItems()) {
                BigDecimal stock = i.getProduct().getStock().max(BigDecimal.ZERO);
                int n = stock.divide(i.getQuantity(), 0, RoundingMode.FLOOR).intValue();
                counts.add(new int[]{n});
                min = Math.min(min, n);
            }
            List<CapacityDto.Material> mats = new ArrayList<>();
            String limiting = null;
            for (int k = 0; k < f.getItems().size(); k++) {
                FormulaItem i = f.getItems().get(k);
                Product p = i.getProduct();
                boolean lim = counts.get(k)[0] == min;
                if (lim && limiting == null) limiting = p.getName();
                mats.add(new CapacityDto.Material(p.getId(), p.getCode(), p.getName(), p.getUnit().getCode(), p.getStock(),
                        i.getQuantity(), counts.get(k)[0], lim));
            }
            out.add(new CapacityDto(f.getId(), f.getName(), f.getProduct().getName(), min,
                    f.getExpectedBags().multiply(BigDecimal.valueOf(min)), limiting, mats));
        }
        return out;
    }

    @Transactional
    public DispatchDto dispatch(DispatchRequest req) {
        Instant at = when(req.dispatchedAt(), "del despacho");
        Set<Long> seen = new HashSet<>();
        Map<Long, Product> byId = new LinkedHashMap<>();
        List<String> missing = new ArrayList<>();
        for (DispatchRequest.Item i : req.items()) {
            if (!seen.add(i.productId())) throw new BusinessException("Hay un producto repetido en el despacho.");
            Product p = products.findById(i.productId())
                    .orElseThrow(() -> new BusinessException("El producto no existe.", HttpStatus.NOT_FOUND));
            if (!"PRODUCTO_TERMINADO".equals(p.getCategory().getCode())) {
                throw new BusinessException("Solo se despacha producto terminado. " + p.getName() + " no lo es.");
            }
            if (p.getStock().compareTo(i.quantity()) < 0) {
                missing.add(p.getName().toLowerCase() + " (hay " + fmt(p.getStock()) + ", se piden " + fmt(i.quantity()) + ")");
            }
            byId.put(p.getId(), p);
        }
        if (!missing.isEmpty()) throw new BusinessException("No hay suficiente " + String.join("; ni ", missing) + ".");

        String prefix = "D-" + Year.from(at.atZone(BatchService.ZONE)).getValue() + "-";
        int next = dispatches.findMaxCodeWithPrefix(prefix).map(c -> Integer.parseInt(c.substring(prefix.length())) + 1).orElse(1);
        Dispatch d = dispatches.save(new Dispatch(prefix + String.format("%04d", next), req.customerName().trim(), at,
                currentUser.entityOrNull()));
        Map<String, Object> items = new LinkedHashMap<>();
        for (DispatchRequest.Item i : req.items()) {
            Product p = byId.get(i.productId());
            d.getItems().add(new DispatchItem(d, p, i.quantity()));
            inventory.register(p.getId(), MovementType.SALIDA_DESPACHO, i.quantity(), "DESPACHO", d.getId(), null);
            items.put(p.getCode(), i.quantity());
        }
        audit.log("REGISTRAR_DESPACHO", "dispatch", d.getId(), Map.of("codigo", d.getCode(), "cliente", d.getCustomerName(), "productos", items));
        return DispatchDto.of(d);
    }

    @Transactional
    public WasteDto registerWaste(WasteRequest req) {
        Instant at = when(req.recordedAt(), "del desperdicio");
        Product p = products.findById(req.productId())
                .orElseThrow(() -> new BusinessException("El producto no existe.", HttpStatus.NOT_FOUND));
        Batch batch = req.batchId() == null ? null : batches.findById(req.batchId())
                .orElseThrow(() -> new BusinessException("La cochada no existe.", HttpStatus.NOT_FOUND));
        String notes = req.notes() == null || req.notes().isBlank() ? null : req.notes().trim();
        Waste w = waste.save(new Waste(p, batch, req.quantity(), req.reason().trim(), at, currentUser.entityOrNull()));
        inventory.register(p.getId(), MovementType.DESPERDICIO, req.quantity(), "DESPERDICIO", w.getId(),
                notes == null ? w.getReason() : w.getReason() + " — " + notes);
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("producto", p.getCode());
        details.put("cantidad", req.quantity());
        details.put("motivo", w.getReason());
        if (notes != null) details.put("observaciones", notes);
        if (batch != null) details.put("cochada", batch.getCode());
        audit.log("REGISTRAR_DESPERDICIO", "waste", w.getId(), details);
        return WasteDto.of(w);
    }

    private static Instant when(Instant requested, String what) {
        Instant at = requested == null ? Instant.now() : requested;
        if (at.isAfter(Instant.now().plus(Duration.ofMinutes(10)))) {
            throw new BusinessException("La fecha " + what + " no puede estar en el futuro.");
        }
        return at;
    }

    private static String fmt(BigDecimal n) { return n.stripTrailingZeros().toPlainString(); }
}
