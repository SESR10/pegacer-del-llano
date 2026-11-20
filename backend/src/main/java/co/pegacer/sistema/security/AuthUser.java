package co.pegacer.sistema.security;

/** Usuario que hizo la petición, tomado del token JWT ya validado. */
public record AuthUser(Long id, String username, String fullName, String role) {
}
