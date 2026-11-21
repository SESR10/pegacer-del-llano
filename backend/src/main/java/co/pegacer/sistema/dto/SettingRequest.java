package co.pegacer.sistema.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SettingRequest(@NotBlank(message = "Escriba el valor.") @Size(max = 200, message = "El valor admite máximo 200 caracteres.") String value) { }
