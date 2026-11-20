package co.pegacer.sistema.security;

import co.pegacer.sistema.entity.AppUser;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** Acceso al usuario de la petición actual, para auditoría y para registrar quién hizo cada operación. */
@Component
public class CurrentUser {
    private final UserRepository users;

    public CurrentUser(UserRepository users) { this.users = users; }

    public Optional<AuthUser> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof AuthUser u ? Optional.of(u) : Optional.empty();
    }

    public AuthUser require() {
        return get().orElseThrow(() -> new BusinessException("Debe iniciar sesión para continuar.", HttpStatus.UNAUTHORIZED));
    }

    /** Referencia JPA al usuario actual (sin consultar la base), o null si no hay sesión. */
    public AppUser entityOrNull() {
        return get().map(u -> users.getReferenceById(u.id())).orElse(null);
    }
}
