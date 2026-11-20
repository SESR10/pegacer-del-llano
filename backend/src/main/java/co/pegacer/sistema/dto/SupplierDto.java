package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.Supplier;

public record SupplierDto(Long id, String nit, String name, String phone, String email, String city,
                          boolean active, boolean demo) {
    public static SupplierDto of(Supplier s) {
        return new SupplierDto(s.getId(), s.getNit(), s.getName(), s.getPhone(), s.getEmail(), s.getCity(),
                s.isActive(), s.isDemo());
    }
}
