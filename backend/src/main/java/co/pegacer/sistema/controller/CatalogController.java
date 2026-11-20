package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.ApiResponse;
import co.pegacer.sistema.dto.CatalogsDto;
import co.pegacer.sistema.service.CatalogService;
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
}
