package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.MovementDto;
import co.pegacer.sistema.dto.MovementRequest;
import co.pegacer.sistema.dto.PageDto;
import co.pegacer.sistema.dto.ProductDto;
import co.pegacer.sistema.entity.InventoryMovement;
import co.pegacer.sistema.entity.MovementType;
import co.pegacer.sistema.entity.Product;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.InventoryMovementRepository;
import co.pegacer.sistema.repository.ProductRepository;
import co.pegacer.sistema.security.CurrentUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Motor del kardex. Toda entrada o salida de inventario pasa por {@link #register}: bloquea el producto,
 * valida que no quede stock negativo, actualiza el stock y deja el movimiento con stock antes/después.
 * Compras, cochadas, despachos y desperdicios (Fases 8–12) usan este mismo método.
 */
@Service
public class InventoryService {
    private final ProductRepository products;
    private final InventoryMovementRepository movements;
    private final AlertService alerts;
    private final AuditService audit;
    private final CurrentUser currentUser;

    public InventoryService(ProductRepository products, InventoryMovementRepository movements, AlertService alerts,
                            AuditService audit, CurrentUser currentUser) {
        this.products = products;
        this.movements = movements;
        this.alerts = alerts;
        this.audit = audit;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<ProductDto> stock(String category) {
        return products.search(category, false).stream().map(ProductDto::of).toList();
    }

    @Transactional(readOnly = true)
    public PageDto<MovementDto> movements(Long productId, MovementType type, Instant from, Instant to, int page, int size) {
        return PageDto.of(movements.search(productId, type, from, to, PageRequest.of(page, size)), MovementDto::of);
    }

    /** Registra un movimiento. Si es una salida y no alcanza el stock, lanza un error claro y no cambia nada. */
    @Transactional
    public InventoryMovement register(Long productId, MovementType type, BigDecimal quantity,
                                      String referenceType, Long referenceId, String notes) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new BusinessException("La cantidad debe ser mayor que cero.");
        }
        Product p = products.findByIdForUpdate(productId)
                .orElseThrow(() -> new BusinessException("El producto no existe.", HttpStatus.NOT_FOUND));
        if (!p.isActive()) {
            throw new BusinessException(p.getName() + " está inactivo: no se le pueden registrar movimientos.");
        }
        BigDecimal before = p.getStock();
        BigDecimal after = type.isEntry() ? before.add(quantity) : before.subtract(quantity);
        if (after.signum() < 0) {
            throw new BusinessException("No hay suficiente " + p.getName().toLowerCase() + ": hay " + fmt(before)
                    + " y se necesitan " + fmt(quantity) + " (unidad: " + p.getUnit().getName().toLowerCase() + ").");
        }
        p.setStock(after);
        InventoryMovement m = movements.save(new InventoryMovement(p, type, quantity, before, after,
                referenceType, referenceId, currentUser.entityOrNull(), notes));
        alerts.checkStock(p);
        return m;
    }

    /** Ajuste manual desde la pantalla de inventario (conteo físico, corrección). */
    @Transactional
    public MovementDto adjust(MovementRequest req) {
        if (req.type() != MovementType.AJUSTE_POS && req.type() != MovementType.AJUSTE_NEG) {
            throw new BusinessException("Desde aquí solo se registran ajustes (AJUSTE_POS o AJUSTE_NEG). "
                    + "Las compras, cochadas, despachos y desperdicios se registran en su propio módulo.");
        }
        InventoryMovement m = register(req.productId(), req.type(), req.quantity(), "AJUSTE", null, req.notes().trim());
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("producto", m.getProduct().getCode());
        details.put("tipo", req.type().name());
        details.put("cantidad", req.quantity());
        details.put("stockAntes", m.getStockBefore());
        details.put("stockDespues", m.getStockAfter());
        details.put("motivo", m.getNotes());
        audit.log("AJUSTE_INVENTARIO", "inventory_movement", m.getId(), details);
        return MovementDto.of(m);
    }

    private static String fmt(BigDecimal n) { return n.stripTrailingZeros().toPlainString(); }
}
