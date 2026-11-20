package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.*;
import co.pegacer.sistema.service.ProductionQueryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Consultas de producción y movimientos de negocio. El registro de cada uno llega en las Fases 9–12. */
@Tag(name = "Producción, compras y salidas (consulta)")
@RestController
@RequestMapping("/api")
public class ProductionController {
    private final ProductionQueryService q;

    public ProductionController(ProductionQueryService q) { this.q = q; }

    @GetMapping("/formulas")
    public ApiResponse<List<FormulaDto>> formulas() { return ApiResponse.ok(q.formulas()); }

    @GetMapping("/formulas/{id}")
    public ApiResponse<FormulaDto> formula(@PathVariable Long id) { return ApiResponse.ok(q.formula(id)); }

    @GetMapping("/batches")
    public ApiResponse<PageDto<BatchDto>> batches(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(q.batches(Math.max(page, 0), Pagination.size(size)));
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
