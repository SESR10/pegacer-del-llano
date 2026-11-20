package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.Dispatch;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record DispatchDto(Long id, String code, String customerName, Instant dispatchedAt, String user, List<Item> items) {
    public record Item(Long productId, String code, String name, String unit, BigDecimal quantity) { }

    public static DispatchDto of(Dispatch d) {
        return new DispatchDto(d.getId(), d.getCode(), d.getCustomerName(), d.getDispatchedAt(),
                d.getUser() == null ? null : d.getUser().getFullName(),
                d.getItems().stream().map(i -> new Item(i.getProduct().getId(), i.getProduct().getCode(),
                        i.getProduct().getName(), i.getProduct().getUnit().getCode(), i.getQuantity())).toList());
    }
}
