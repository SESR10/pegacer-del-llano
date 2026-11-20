package co.pegacer.sistema.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank(message = "El NIT es obligatorio.") @Size(max = 30, message = "El NIT admite máximo 30 caracteres.") String nit,
        @NotBlank(message = "El nombre es obligatorio.") @Size(max = 120, message = "El nombre admite máximo 120 caracteres.") String name,
        @Size(max = 30, message = "El teléfono admite máximo 30 caracteres.") String phone,
        @Email(message = "El correo no es válido.") @Size(max = 120) String email,
        @Size(max = 60, message = "La ciudad admite máximo 60 caracteres.") String city,
        Boolean active) {
}
