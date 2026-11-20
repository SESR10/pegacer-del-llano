package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.Product;

import java.math.BigDecimal;

/** stockStatus: OK, BAJO (por debajo del mínimo) o AGOTADO. */
public record ProductDto(Long id, String code, String name, String category, String categoryName,
                         String unit, String unitName, BigDecimal stock, BigDecimal minStock,
                         BigDecimal unitCost, boolean active, String stockStatus, boolean demo) {
    public static ProductDto of(Product p) {
        String status = p.getStock().signum() == 0 ? "AGOTADO"
                : p.getStock().compareTo(p.getMinStock()) < 0 ? "BAJO" : "OK";
        return new ProductDto(p.getId(), p.getCode(), p.getName(), p.getCategory().getCode(), p.getCategory().getName(),
                p.getUnit().getCode(), p.getUnit().getName(), p.getStock(), p.getMinStock(), p.getUnitCost(),
                p.isActive(), status, p.isDemo());
    }
}
