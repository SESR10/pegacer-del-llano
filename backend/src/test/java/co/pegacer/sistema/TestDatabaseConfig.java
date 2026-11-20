package co.pegacer.sistema;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/** Cada corrida de pruebas arranca con la base pegacer_test limpia (esquema + datos DEMO). */
@TestConfiguration
class TestDatabaseConfig {
    @Bean
    FlywayMigrationStrategy cleanMigrate() {
        return flyway -> { flyway.clean(); flyway.migrate(); };
    }
}
