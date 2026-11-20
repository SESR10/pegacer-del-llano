package co.pegacer.sistema.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Escriba su contraseña actual.") String currentPassword,
        @NotBlank(message = "Escriba la nueva contraseña.")
        @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres.")
        String newPassword) {
}
