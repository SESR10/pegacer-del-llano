package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.ApiResponse;
import co.pegacer.sistema.dto.InventoryReportDto;
import co.pegacer.sistema.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@Tag(name = "Reportes")
@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reports;

    public ReportController(ReportService reports) { this.reports = reports; }

    @Operation(summary = "Movimiento del inventario en un periodo",
            description = "Saldo inicial, entradas, salidas (por tipo) y saldo final de cada producto activo.")
    @GetMapping("/inventory")
    public ApiResponse<InventoryReportDto> inventory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ApiResponse.ok(reports.inventory(from, to));
    }
}
