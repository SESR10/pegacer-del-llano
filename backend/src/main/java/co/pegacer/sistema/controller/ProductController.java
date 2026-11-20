package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.ApiResponse;
import co.pegacer.sistema.dto.ProductDto;
import co.pegacer.sistema.dto.ProductRequest;
import co.pegacer.sistema.security.Roles;
import co.pegacer.sistema.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Productos")
@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService products;

    public ProductController(ProductService products) { this.products = products; }

    @Operation(summary = "Listar productos", description = "category: MATERIA_PRIMA, INSUMO o PRODUCTO_TERMINADO.")
    @GetMapping
    public ApiResponse<List<ProductDto>> list(@RequestParam(required = false) String category,
                                              @RequestParam(defaultValue = "false") boolean includeInactive) {
        return ApiResponse.ok(products.list(category, includeInactive));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductDto> get(@PathVariable Long id) { return ApiResponse.ok(products.get(id)); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Roles.PRODUCTOS)
    public ApiResponse<ProductDto> create(@Valid @RequestBody ProductRequest req) {
        return ApiResponse.ok("Producto creado.", products.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize(Roles.PRODUCTOS)
    public ApiResponse<ProductDto> update(@PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        return ApiResponse.ok("Producto actualizado.", products.update(id, req));
    }

    @Operation(summary = "Eliminar producto", description = "Si ya tiene movimientos de inventario se desactiva en lugar de borrarse.")
    @DeleteMapping("/{id}")
    @PreAuthorize(Roles.PRODUCTOS)
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.ok(products.delete(id), null);
    }
}
