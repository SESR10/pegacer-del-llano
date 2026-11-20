package co.pegacer.sistema.dto;

import jakarta.validation.constraints.*;

/** Editar un usuario. password es opcional: si viene, se cambia. */
public record UserUpdateRequest(
        @NotBlank(message = "El nombre completo es obligatorio.") @Size(max = 120) String fullName,
        @Email(message = "El correo no es válido.") @Size(max = 120) String email,
        @NotBlank(message = "El rol es obligatorio.") String role,
        @NotNull(message = "Indique si el usuario está activo.") Boolean active,
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.") String password) {
}
