package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.InventoryReportDto;
import co.pegacer.sistema.entity.MovementType;
import co.pegacer.sistema.entity.Product;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.InventoryMovementRepository;
import co.pegacer.sistema.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/** Fase 14: reportes que necesitan el kardex completo (los demás se calculan en la pantalla con los datos ya cargados). */
@Service
public class ReportService {
    private final InventoryMovementRepository movements;
    private final ProductRepository products;

    public ReportService(InventoryMovementRepository movements, ProductRepository products) {
        this.movements = movements;
        this.products = products;
    }

    /**
     * Saldo inicial, entradas, salidas y saldo final por producto en [from, to).
     * El saldo final se obtiene del stock actual restando lo que se movió después de "to".
     */
    @Transactional(readOnly = true)
    public InventoryReportDto inventory(Instant from, Instant to) {
        if (from == null || to == null) throw new BusinessException("Indique el periodo (desde y hasta).");
        if (!from.isBefore(to)) throw new BusinessException("La fecha inicial debe ser anterior a la final.");
        if (Duration.between(from, to).toDays() > 400) throw new BusinessException("El periodo puede ser de máximo un año.");

        Map<Long, Map<MovementType, BigDecimal>> inRange = group(movements.totalsByProductAndType(from, to));
        Map<Long, Map<MovementType, BigDecimal>> after = group(movements.totalsByProductAndType(to, Instant.now().plus(Duration.ofDays(1))));

        List<InventoryReportDto.Row> rows = new ArrayList<>();
        for (Product p : products.search(null, false)) {
            Map<MovementType, BigDecimal> m = inRange.getOrDefault(p.getId(), Map.of());
            BigDecimal entries = sum(m, true), exits = sum(m, false);
            Map<MovementType, BigDecimal> later = after.getOrDefault(p.getId(), Map.of());
            BigDecimal closing = p.getStock().subtract(sum(later, true)).add(sum(later, false));
            BigDecimal opening = closing.subtract(entries).add(exits);
            Map<String, BigDecimal> byType = new LinkedHashMap<>();
            m.forEach((k, v) -> byType.put(k.name(), v));
            rows.add(new InventoryReportDto.Row(p.getId(), p.getCode(), p.getName(), p.getCategory().getCode(),
                    p.getUnit().getCode(), p.getUnitCost(), opening, entries, exits, closing, byType));
        }
        return new InventoryReportDto(from, to, rows);
    }

    private static Map<Long, Map<MovementType, BigDecimal>> group(List<Object[]> raw) {
        Map<Long, Map<MovementType, BigDecimal>> out = new HashMap<>();
        for (Object[] r : raw) {
            out.computeIfAbsent((Long) r[0], k -> new EnumMap<>(MovementType.class)).put((MovementType) r[1], (BigDecimal) r[2]);
        }
        return out;
    }

    private static BigDecimal sum(Map<MovementType, BigDecimal> m, boolean entries) {
        return m.entrySet().stream().filter(e -> e.getKey().isEntry() == entries).map(Map.Entry::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
