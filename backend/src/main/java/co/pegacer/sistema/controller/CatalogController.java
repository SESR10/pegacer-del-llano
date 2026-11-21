package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.ApiResponse;
import co.pegacer.sistema.dto.CatalogsDto;
import co.pegacer.sistema.dto.SettingRequest;
import co.pegacer.sistema.security.Roles;
import co.pegacer.sistema.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Catálogos y configuración")
@RestController
@RequestMapping("/api")
public class CatalogController {
    private final CatalogService catalogs;

    public CatalogController(CatalogService catalogs) { this.catalogs = catalogs; }

    @GetMapping("/catalogs")
    public ApiResponse<CatalogsDto> catalogs() { return ApiResponse.ok(catalogs.catalogs()); }

    @GetMapping("/settings")
    public ApiResponse<Map<String, String>> settings() { return ApiResponse.ok(catalogs.settings()); }

    @PutMapping("/settings/{key}")
    @PreAuthorize(Roles.PRODUCCION)
    public ApiResponse<Map<String, String>> updateSetting(@PathVariable String key, @Valid @RequestBody SettingRequest req) {
        return ApiResponse.ok("Parámetro actualizado.", catalogs.updateSetting(key, req.value()));
    }
}
