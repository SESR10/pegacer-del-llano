package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.AlertDto;
import co.pegacer.sistema.dto.ApiResponse;
import co.pegacer.sistema.security.Roles;
import co.pegacer.sistema.service.AlertService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Alertas")
@RestController
@RequestMapping("/api/alerts")
public class AlertController {
    private final AlertService alerts;

    public AlertController(AlertService alerts) { this.alerts = alerts; }

    @GetMapping
    public ApiResponse<List<AlertDto>> list(@RequestParam(required = false) Boolean resolved) {
        return ApiResponse.ok(alerts.list(resolved));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize(Roles.ALERTAS)
    public ApiResponse<AlertDto> resolve(@PathVariable Long id) {
        return ApiResponse.ok("Alerta marcada como atendida.", alerts.resolve(id));
    }
}
