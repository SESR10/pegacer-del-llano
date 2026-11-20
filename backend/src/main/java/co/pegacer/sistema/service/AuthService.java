package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.ChangePasswordRequest;
import co.pegacer.sistema.dto.LoginRequest;
import co.pegacer.sistema.dto.LoginResponse;
import co.pegacer.sistema.dto.UserDto;
import co.pegacer.sistema.entity.AppUser;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.UserRepository;
import co.pegacer.sistema.security.CurrentUser;
import co.pegacer.sistema.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {
    static final String BAD_CREDENTIALS = "Usuario o contraseña incorrectos.";

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AuditService audit;
    private final CurrentUser currentUser;
    /** Hash de relleno: si el usuario no existe se compara igual, para no revelar qué usuarios existen. */
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, AuditService audit,
                       CurrentUser currentUser) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.audit = audit;
        this.currentUser = currentUser;
        this.dummyHash = encoder.encode("contraseña-de-relleno");
    }

    @Transactional
    public LoginResponse login(LoginRequest req) {
        Optional<AppUser> found = users.findByUsernameIgnoreCase(req.username().trim());
        boolean ok = encoder.matches(req.password(), found.map(AppUser::getPasswordHash).orElse(dummyHash));
        if (found.isEmpty() || !ok) {
            throw new BusinessException(BAD_CREDENTIALS, HttpStatus.UNAUTHORIZED);
        }
        AppUser u = found.get();
        if (!u.isActive()) {
            throw new BusinessException("Su usuario está inactivo. Hable con el administrador.", HttpStatus.UNAUTHORIZED);
        }
        JwtService.Token token = jwt.generate(u);
        audit.log(u, "INICIO_SESION", "user", u.getId(), Map.of("usuario", u.getUsername()));
        return new LoginResponse(token.value(), token.expiresAt(), UserDto.of(u));
    }

    @Transactional(readOnly = true)
    public UserDto me() {
        return users.findById(currentUser.require().id()).map(UserDto::of)
                .orElseThrow(() -> new BusinessException("Debe iniciar sesión para continuar.", HttpStatus.UNAUTHORIZED));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest req) {
        AppUser u = users.findById(currentUser.require().id())
                .orElseThrow(() -> new BusinessException("Debe iniciar sesión para continuar.", HttpStatus.UNAUTHORIZED));
        if (!encoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw new BusinessException("La contraseña actual no es correcta.");
        }
        u.setPasswordHash(encoder.encode(req.newPassword()));
        audit.log("CAMBIAR_CONTRASENA", "user", u.getId(), Map.of("usuario", u.getUsername()));
    }
}
