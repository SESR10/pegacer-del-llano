package co.pegacer.sistema.dto;

import java.time.Instant;

/** privacyPending: el usuario aún no ha aceptado la versión vigente de la Política de Tratamiento de Datos. */
public record LoginResponse(String token, Instant expiresAt, UserDto user, boolean privacyPending) {
}
