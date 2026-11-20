package co.pegacer.sistema.dto;

import jakarta.validation.constraints.*;

public record UserCreateRequest(
        @NotBlank(message = "El usuario es obligatorio.")
        @Pattern(regexp = "^[a-zA-Z0-9._-]{3,50}$", message = "El usuario debe tener entre 3 y 50 letras, números, punto, guion o guion bajo.")
        String username,
        @NotBlank(message = "El nombre completo es obligatorio.") @Size(max = 120) String fullName,
        @Email(message = "El correo no es válido.") @Size(max = 120) String email,
        @NotBlank(message = "El rol es obligatorio.") String role,
        @NotBlank(message = "La contraseña es obligatoria.")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.")
        String password) {
}
