package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.BatchDto;
import co.pegacer.sistema.dto.BatchRequest;
import co.pegacer.sistema.entity.*;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.AlertRepository;
import co.pegacer.sistema.repository.BatchRepository;
import co.pegacer.sistema.repository.FormulaRepository;
import co.pegacer.sistema.repository.SettingRepository;
import co.pegacer.sistema.security.CurrentUser;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.Year;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Registro de cochadas (Fase 10). En una sola transacción:
 * descuenta del kardex la materia prima consumida, suma las bolsas de producto terminado,
 * guarda el consumo real frente al teórico y crea las alertas de consumo fuera de rango y de producción baja.
 * Si algo falla (por ejemplo, no alcanza el stock) no se guarda nada.
 */
@Service
public class BatchService {
    static final ZoneId ZONE = ZoneId.of("America/Bogota");

    private final FormulaRepository formulas;
    private final BatchRepository batches;
    private final SettingRepository settings;
    private final AlertRepository alerts;
    private final InventoryService inventory;
    private final AuditService audit;
    private final CurrentUser currentUser;
    private final EntityManager em;

    public BatchService(FormulaRepository formulas, BatchRepository batches, SettingRepository settings,
                        AlertRepository alerts, InventoryService inventory, AuditService audit,
                        CurrentUser currentUser, EntityManager em) {
        this.formulas = formulas;
        this.batches = batches;
        this.settings = settings;
        this.alerts = alerts;
        this.inventory = inventory;
        this.audit = audit;
        this.currentUser = currentUser;
        this.em = em;
    }

    @Transactional
    public BatchDto register(BatchRequest req) {
        Formula f = formulas.findWithItemsById(req.formulaId())
                .orElseThrow(() -> new BusinessException("La fórmula no existe.", HttpStatus.NOT_FOUND));
        if (!f.isActive()) throw new BusinessException("La fórmula " + f.getName() + " no está activa.");
        if (f.getItems().isEmpty()) throw new BusinessException("La fórmula " + f.getName() + " no tiene materiales.");

        Instant producedAt = req.producedAt() == null ? Instant.now() : req.producedAt();
        if (producedAt.isAfter(Instant.now().plus(Duration.ofMinutes(10)))) {
            throw new BusinessException("La fecha de la cochada no puede estar en el futuro.");
        }

        Map<Long, BigDecimal> real = new HashMap<>();
        for (BatchRequest.Item i : req.consumptions()) {
            if (real.put(i.productId(), i.realQty()) != null) {
                throw new BusinessException("Hay un material repetido en el consumo.");
            }
        }
        Set<Long> formulaProducts = f.getItems().stream().map(i -> i.getProduct().getId()).collect(Collectors.toSet());
        for (FormulaItem item : f.getItems()) {
            if (!real.containsKey(item.getProduct().getId())) {
                throw new BusinessException("Falta el consumo real de " + item.getProduct().getName().toLowerCase() + ".");
            }
        }
        if (!formulaProducts.containsAll(real.keySet())) {
            throw new BusinessException("Solo se registra el consumo de los materiales de la fórmula.");
        }

        // Se revisa todo el stock antes de guardar, para avisar de una vez qué materiales no alcanzan.
        List<String> missing = new ArrayList<>();
        for (FormulaItem item : f.getItems()) {
            Product p = item.getProduct();
            BigDecimal qty = real.get(p.getId());
            if (p.getStock().compareTo(qty) < 0) {
                missing.add(p.getName().toLowerCase() + " (hay " + fmt(p.getStock()) + ", se necesitan " + fmt(qty) + ")");
            }
        }
        if (!missing.isEmpty()) {
            throw new BusinessException("No hay suficiente " + String.join("; ni ", missing) + ".");
        }

        String notes = req.notes() == null || req.notes().isBlank() ? null : req.notes().trim();
        Batch batch = batches.save(new Batch(nextCode(producedAt), f, producedAt, currentUser.entityOrNull(),
                req.bagsProduced(), notes));

        BigDecimal tolerance = tolerance();
        List<String> outOfRange = new ArrayList<>();
        for (FormulaItem item : f.getItems()) {
            Product p = item.getProduct();
            BigDecimal qty = real.get(p.getId());
            batch.getConsumptions().add(new BatchConsumption(batch, p, item.getQuantity(), qty));
            inventory.register(p.getId(), MovementType.CONSUMO_COCHADA, qty, "COCHADA", batch.getId(), null);
            BigDecimal pct = qty.subtract(item.getQuantity()).multiply(BigDecimal.valueOf(100))
                    .divide(item.getQuantity(), 2, RoundingMode.HALF_UP);
            if (pct.abs().compareTo(tolerance) > 0) {
                outOfRange.add(p.getName());
                alerts.save(new Alert("CONSUMO_FUERA_RANGO", "MEDIA", p, batch, "Cochada " + batch.getCode()
                        + ": consumo de " + p.getName() + " " + pct.toPlainString() + " % "
                        + (pct.signum() > 0 ? "sobre" : "bajo") + " la fórmula."));
            }
        }
        inventory.register(f.getProduct().getId(), MovementType.PRODUCCION, req.bagsProduced(), "COCHADA", batch.getId(), null);

        boolean low = req.bagsProduced().compareTo(f.getMinBags()) < 0;
        if (low) {
            alerts.save(new Alert("PRODUCCION_BAJA", "MEDIA", null, batch, "Cochada " + batch.getCode() + ": produjo "
                    + fmt(req.bagsProduced()) + " bolsas (mínimo esperado " + fmt(f.getMinBags()) + ")."));
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("codigo", batch.getCode());
        details.put("formula", f.getName());
        details.put("bolsas", req.bagsProduced());
        details.put("consumos", f.getItems().stream().collect(Collectors.toMap(
                i -> i.getProduct().getCode(), i -> real.get(i.getProduct().getId()), (a, b) -> a, LinkedHashMap::new)));
        details.put("consumoFueraDeRango", outOfRange);
        details.put("produccionBaja", low);
        audit.log("REGISTRAR_COCHADA", "batch", batch.getId(), details);

        // La variación la calcula PostgreSQL (columnas generadas): se recarga la cochada para devolverla completa.
        em.flush();
        Long id = batch.getId();
        em.clear();
        Batch saved = batches.findWithDetailsById(id).orElseThrow();
        return BatchDto.of(saved, saved.getConsumptions());
    }

    /** Código consecutivo por año: C-2026-0001, C-2026-0002… */
    private String nextCode(Instant producedAt) {
        String prefix = "C-" + Year.from(producedAt.atZone(ZONE)).getValue() + "-";
        int next = batches.findMaxCodeWithPrefix(prefix)
                .map(c -> Integer.parseInt(c.substring(prefix.length())) + 1).orElse(1);
        return prefix + String.format("%04d", next);
    }

    private BigDecimal tolerance() {
        return settings.findById("consumo.tolerancia_pct").map(s -> {
            try { return new BigDecimal(s.getValue().trim()); } catch (NumberFormatException e) { return null; }
        }).filter(Objects::nonNull).orElse(BigDecimal.valueOf(5));
    }

    private static String fmt(BigDecimal n) { return n.stripTrailingZeros().toPlainString(); }
}
