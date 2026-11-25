package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.PurchaseDto;
import co.pegacer.sistema.dto.PurchaseRequest;
import co.pegacer.sistema.entity.*;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.ProductRepository;
import co.pegacer.sistema.repository.PurchaseRepository;
import co.pegacer.sistema.repository.SupplierRepository;
import co.pegacer.sistema.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.Year;
import java.util.*;

/**
 * Fase 12: compras. Cada producto comprado entra al inventario (ENTRADA_COMPRA, queda en el kardex)
 * y, si trae costo, actualiza el costo unitario del producto.
 */
@Service
public class PurchaseService {
    private final PurchaseRepository purchases;
    private final SupplierRepository suppliers;
    private final ProductRepository products;
    private final InventoryService inventory;
    private final AuditService audit;
    private final CurrentUser currentUser;

    public PurchaseService(PurchaseRepository purchases, SupplierRepository suppliers, ProductRepository products,
                           InventoryService inventory, AuditService audit, CurrentUser currentUser) {
        this.purchases = purchases;
        this.suppliers = suppliers;
        this.products = products;
        this.inventory = inventory;
        this.audit = audit;
        this.currentUser = currentUser;
    }

    @Transactional
    public PurchaseDto register(PurchaseRequest req) {
        Instant at = req.purchasedAt() == null ? Instant.now() : req.purchasedAt();
        if (at.isAfter(Instant.now().plus(Duration.ofMinutes(10)))) {
            throw new BusinessException("La fecha de la compra no puede estar en el futuro.");
        }
        Supplier supplier = suppliers.findById(req.supplierId())
                .orElseThrow(() -> new BusinessException("El proveedor no existe.", HttpStatus.NOT_FOUND));
        if (!supplier.isActive()) throw new BusinessException("El proveedor " + supplier.getName() + " está inactivo. Actívelo en Proveedores.");
        String invoice = req.invoiceNumber() == null || req.invoiceNumber().isBlank() ? null : req.invoiceNumber().trim();
        if (invoice != null && purchases.existsBySupplierIdAndInvoiceNumberIgnoreCase(supplier.getId(), invoice)) {
            throw new BusinessException(end("Ya se registró la factura " + invoice + " de " + supplier.getName()), HttpStatus.CONFLICT);
        }
        Set<Long> seen = new HashSet<>();
        Map<Long, Product> byId = new HashMap<>();
        for (PurchaseRequest.Item i : req.items()) {
            if (!seen.add(i.productId())) throw new BusinessException("Hay un producto repetido en la compra.");
            Product p = products.findById(i.productId())
                    .orElseThrow(() -> new BusinessException("El producto no existe.", HttpStatus.NOT_FOUND));
            if ("PRODUCTO_TERMINADO".equals(p.getCategory().getCode())) {
                throw new BusinessException("El producto terminado sale de las cochadas, no se compra. Revise " + p.getName() + ".");
            }
            byId.put(p.getId(), p);
        }

        String prefix = "OC-" + Year.from(at.atZone(BatchService.ZONE)).getValue() + "-";
        int next = purchases.findMaxCodeWithPrefix(prefix).map(c -> Integer.parseInt(c.substring(prefix.length())) + 1).orElse(1);
        Purchase purchase = purchases.save(new Purchase(prefix + String.format("%04d", next), supplier, at, invoice,
                currentUser.entityOrNull()));
        Map<String, Object> items = new LinkedHashMap<>();
        for (PurchaseRequest.Item i : req.items()) {
            Product p = byId.get(i.productId());
            purchase.getItems().add(new PurchaseItem(purchase, p, i.quantity(), i.unitCost()));
            inventory.register(p.getId(), MovementType.ENTRADA_COMPRA, i.quantity(), "COMPRA", purchase.getId(),
                    "Compra " + purchase.getCode() + " a " + supplier.getName());
            if (i.unitCost() != null) p.setUnitCost(i.unitCost());
            items.put(p.getCode(), i.quantity());
        }
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("codigo", purchase.getCode());
        details.put("proveedor", supplier.getName());
        if (invoice != null) details.put("factura", invoice);
        details.put("productos", items);
        audit.log("REGISTRAR_COMPRA", "purchase", purchase.getId(), details);
        return PurchaseDto.of(purchase);
    }

    /** Cierra la frase con punto sin duplicarlo (p. ej. "S.A.S."). */
    private static String end(String s) { return s.endsWith(".") ? s : s + "."; }
}
