package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.*;
import co.pegacer.sistema.security.Roles;
import co.pegacer.sistema.service.BatchService;
import co.pegacer.sistema.service.FormulaService;
import co.pegacer.sistema.service.OperationsService;
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
    private final FormulaService formulaService;
    private final OperationsService ops;

    public ProductionController(ProductionQueryService q, BatchService batchService, FormulaService formulaService,
                                OperationsService ops) {
        this.q = q;
        this.ops = ops;
        this.batchService = batchService;
        this.formulaService = formulaService;
    }

    @GetMapping("/formulas")
    public ApiResponse<List<FormulaDto>> formulas() { return ApiResponse.ok(q.formulas()); }

    @GetMapping("/formulas/{id}")
    public ApiResponse<FormulaDto> formula(@PathVariable Long id) { return ApiResponse.ok(q.formula(id)); }

    @Operation(summary = "Nueva fórmula o nueva versión",
            description = "Si el producto ya tiene una fórmula activa, se crea la versión siguiente y la anterior queda inactiva.")
    @PostMapping("/formulas")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Roles.PRODUCCION)
    public ApiResponse<FormulaDto> saveFormula(@Valid @RequestBody FormulaRequest req) {
        return ApiResponse.ok("Fórmula guardada.", formulaService.save(req));
    }

    @Operation(summary = "Volver a usar una versión anterior de la fórmula")
    @PatchMapping("/formulas/{id}/activate")
    @PreAuthorize(Roles.PRODUCCION)
    public ApiResponse<FormulaDto> activateFormula(@PathVariable Long id) {
        return ApiResponse.ok("Versión activada.", formulaService.activate(id));
    }

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

    @Operation(summary = "Capacidad de producción", description = "Cochadas posibles con el inventario actual y recurso limitante, por fórmula activa.")
    @GetMapping("/production/capacity")
    public ApiResponse<List<CapacityDto>> capacity() { return ApiResponse.ok(ops.capacity()); }

    @Operation(summary = "Registrar despacho de producto terminado")
    @PostMapping("/dispatches")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Roles.DESPACHOS)
    public ApiResponse<DispatchDto> dispatch(@Valid @RequestBody DispatchRequest req) {
        return ApiResponse.ok("Despacho registrado.", ops.dispatch(req));
    }

    @Operation(summary = "Registrar desperdicio", description = "Descuenta el material del inventario.")
    @PostMapping("/waste")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(Roles.DESPERDICIOS)
    public ApiResponse<WasteDto> registerWaste(@Valid @RequestBody WasteRequest req) {
        return ApiResponse.ok("Desperdicio registrado.", ops.registerWaste(req));
    }

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
