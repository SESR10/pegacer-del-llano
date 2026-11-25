package co.pegacer.sistema.dto;

import java.time.Instant;

/** Estado de la autorización de tratamiento de datos (Ley 1581 de 2012) del usuario de la sesión. */
public record PrivacyStatusDto(String version, Instant acceptedAt, boolean pending) {
}
