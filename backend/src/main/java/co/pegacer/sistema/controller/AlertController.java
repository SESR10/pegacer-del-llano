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

    public record ResolveManyRequest(@jakarta.validation.constraints.NotEmpty(message = "Seleccione al menos una alerta.") List<Long> ids) { }

    @PostMapping("/resolve")
    @PreAuthorize(Roles.ALERTAS)
    public ApiResponse<Integer> resolveMany(@jakarta.validation.Valid @RequestBody ResolveManyRequest req) {
        int n = alerts.resolveMany(req.ids());
        return ApiResponse.ok(n == 1 ? "1 alerta marcada como atendida." : n + " alertas marcadas como atendidas.", n);
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize(Roles.ALERTAS)
    public ApiResponse<AlertDto> resolve(@PathVariable Long id) {
        return ApiResponse.ok("Alerta marcada como atendida.", alerts.resolve(id));
    }
}
