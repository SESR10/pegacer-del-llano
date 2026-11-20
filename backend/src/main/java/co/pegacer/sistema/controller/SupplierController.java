package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.ApiResponse;
import co.pegacer.sistema.dto.SupplierDto;
import co.pegacer.sistema.dto.SupplierRequest;
import co.pegacer.sistema.security.Roles;
import co.pegacer.sistema.service.SupplierService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Proveedores")
@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
    private final SupplierService suppliers;

    public SupplierController(SupplierService suppliers) { this.suppliers = suppliers; }

    @GetMapping
    public ApiResponse<List<SupplierDto>> list() { return ApiResponse.ok(suppliers.list()); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Roles.COMPRAS)
    public ApiResponse<SupplierDto> create(@Valid @RequestBody SupplierRequest req) {
        return ApiResponse.ok("Proveedor creado.", suppliers.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize(Roles.COMPRAS)
    public ApiResponse<SupplierDto> update(@PathVariable Long id, @Valid @RequestBody SupplierRequest req) {
        return ApiResponse.ok("Proveedor actualizado.", suppliers.update(id, req));
    }
}
