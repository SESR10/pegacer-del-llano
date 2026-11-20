package co.pegacer.sistema.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Escriba su usuario.") String username,
        @NotBlank(message = "Escriba su contraseña.") String password) {
}
