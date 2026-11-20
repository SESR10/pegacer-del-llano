package co.pegacer.sistema.security;

import co.pegacer.sistema.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lee el encabezado "Authorization: Bearer ..." y, si el token es válido y el usuario sigue activo,
 * deja la sesión iniciada para esta petición. El rol se lee de la base para que un cambio de rol
 * o la desactivación del usuario apliquen de inmediato.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UserRepository users;

    public JwtAuthFilter(JwtService jwt, UserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            jwt.parse(header.substring(7).trim())
               .flatMap(claims -> users.findByUsernameIgnoreCase(claims.getSubject()))
               .filter(u -> u.isActive())
               .ifPresent(u -> {
                   AuthUser principal = new AuthUser(u.getId(), u.getUsername(), u.getFullName(), u.getRole().getCode());
                   var auth = new UsernamePasswordAuthenticationToken(principal, null,
                           List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().getCode())));
                   SecurityContextHolder.getContext().setAuthentication(auth);
               });
        }
        chain.doFilter(req, res);
    }
}
