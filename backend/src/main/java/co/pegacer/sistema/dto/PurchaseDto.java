package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.Purchase;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PurchaseDto(Long id, String code, Long supplierId, String supplierName, Instant purchasedAt,
                          String invoiceNumber, String user, List<Item> items) {
    public record Item(Long productId, String code, String name, String unit, BigDecimal quantity, BigDecimal unitCost) { }

    public static PurchaseDto of(Purchase p) {
        return new PurchaseDto(p.getId(), p.getCode(), p.getSupplier().getId(), p.getSupplier().getName(),
                p.getPurchasedAt(), p.getInvoiceNumber(), p.getUser() == null ? null : p.getUser().getFullName(),
                p.getItems().stream().map(i -> new Item(i.getProduct().getId(), i.getProduct().getCode(),
                        i.getProduct().getName(), i.getProduct().getUnit().getCode(), i.getQuantity(), i.getUnitCost())).toList());
    }
}
