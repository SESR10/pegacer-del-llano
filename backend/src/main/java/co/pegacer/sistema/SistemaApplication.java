package co.pegacer.sistema;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class SistemaApplication {
    public static void main(String[] args) {
        SpringApplication.run(SistemaApplication.class, args);
    }
}
