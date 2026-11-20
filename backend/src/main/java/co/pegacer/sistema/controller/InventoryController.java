package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.*;
import co.pegacer.sistema.entity.MovementType;
import co.pegacer.sistema.security.Roles;
import co.pegacer.sistema.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@Tag(name = "Inventario y kardex")
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventory;

    public InventoryController(InventoryService inventory) { this.inventory = inventory; }

    @Operation(summary = "Stock actual de los productos activos")
    @GetMapping
    public ApiResponse<List<ProductDto>> stock(@RequestParam(required = false) String category) {
        return ApiResponse.ok(inventory.stock(category));
    }

    @Operation(summary = "Kardex", description = "Movimientos más recientes primero. Filtros opcionales por producto, tipo y fechas (ISO-8601).")
    @GetMapping("/movements")
    public ApiResponse<PageDto<MovementDto>> movements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) MovementType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(inventory.movements(productId, type, from, to, Math.max(page, 0), Pagination.size(size)));
    }

    @Operation(summary = "Ajuste manual de inventario", description = "Solo AJUSTE_POS o AJUSTE_NEG, con motivo obligatorio.")
    @PostMapping("/movements")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Roles.INVENTARIO)
    public ApiResponse<MovementDto> adjust(@Valid @RequestBody MovementRequest req) {
        return ApiResponse.ok("Ajuste registrado.", inventory.adjust(req));
    }
}
