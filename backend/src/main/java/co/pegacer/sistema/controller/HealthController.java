package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.ApiResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/** Estado del servidor y de la base de datos. Lo usa el Dashboard. */
@RestController
@RequestMapping("/api/health")
public class HealthController {
    private final JdbcTemplate jdbc;

    public HealthController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("server", "UP");
        data.put("version", "0.1.0");
        try {
            data.put("schemaVersion", jdbc.queryForObject(
                    "SELECT max(version) FROM flyway_schema_history WHERE success", String.class));
            data.put("products", jdbc.queryForObject("SELECT count(*) FROM products", Long.class));
            data.put("demoData", Boolean.TRUE.equals(jdbc.queryForObject(
                    "SELECT EXISTS (SELECT 1 FROM products WHERE is_demo)", Boolean.class)));
            data.put("database", "UP");
        } catch (Exception e) {
            data.put("database", "DOWN");
        }
        return ApiResponse.ok(data);
    }
}
