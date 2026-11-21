package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.*;
import co.pegacer.sistema.security.Roles;
import co.pegacer.sistema.service.BatchService;
import co.pegacer.sistema.service.ProductionQueryService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Producción y movimientos de negocio. Las cochadas ya se registran (Fase 10); compras y despachos llegan en sus fases. */
@Tag(name = "Producción, compras y salidas (consulta)")
@RestController
@RequestMapping("/api")
public class ProductionController {
    private final ProductionQueryService q;
    private final BatchService batchService;

    public ProductionController(ProductionQueryService q, BatchService batchService) {
        this.q = q;
        this.batchService = batchService;
    }

    @GetMapping("/formulas")
    public ApiResponse<List<FormulaDto>> formulas() { return ApiResponse.ok(q.formulas()); }

    @GetMapping("/formulas/{id}")
    public ApiResponse<FormulaDto> formula(@PathVariable Long id) { return ApiResponse.ok(q.formula(id)); }

    @GetMapping("/batches")
    public ApiResponse<PageDto<BatchDto>> batches(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(q.batches(Math.max(page, 0), Pagination.size(size)));
    }

    @Operation(summary = "Registrar cochada",
            description = "Descuenta la materia prima consumida, suma las bolsas producidas y genera alertas de consumo y producción.")
    @PostMapping("/batches")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Roles.PRODUCCION)
    public ApiResponse<BatchDto> registerBatch(@Valid @RequestBody BatchRequest req) {
        return ApiResponse.ok("Cochada registrada.", batchService.register(req));
    }

    @GetMapping("/batches/{id}")
    public ApiResponse<BatchDto> batch(@PathVariable Long id) { return ApiResponse.ok(q.batch(id)); }

    @GetMapping("/purchases")
    public ApiResponse<PageDto<PurchaseDto>> purchases(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(q.purchases(Math.max(page, 0), Pagination.size(size)));
    }

    @GetMapping("/dispatches")
    public ApiResponse<PageDto<DispatchDto>> dispatches(@RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(q.dispatches(Math.max(page, 0), Pagination.size(size)));
    }

    @GetMapping("/waste")
    public ApiResponse<PageDto<WasteDto>> waste(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(q.waste(Math.max(page, 0), Pagination.size(size)));
    }
}
