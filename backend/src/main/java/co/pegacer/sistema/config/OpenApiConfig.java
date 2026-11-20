package co.pegacer.sistema.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI pegacerOpenApi() {
        return new OpenAPI().info(new Info()
                .title("PEGACER DEL LLANO — API")
                .description("Sistema Integral de Control de Producción e Inventario")
                .version("0.1.0"));
    }
}
