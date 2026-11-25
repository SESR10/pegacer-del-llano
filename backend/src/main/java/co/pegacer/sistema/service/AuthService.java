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
import co.pegacer.sistema.dto.PrivacyStatusDto;
import co.pegacer.sistema.security.LoginAttempts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    private final LoginAttempts attempts;
    /** Versión vigente de la Política de Tratamiento de Datos. Cambiarla obliga a todos a aceptarla de nuevo. */
    private final String privacyVersion;
    /** Hash de relleno: si el usuario no existe se compara igual, para no revelar qué usuarios existen. */
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, AuditService audit,
                       CurrentUser currentUser, LoginAttempts attempts,
                       @Value("${app.privacidad.version}") String privacyVersion) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.audit = audit;
        this.currentUser = currentUser;
        this.attempts = attempts;
        this.privacyVersion = privacyVersion;
        this.dummyHash = encoder.encode("contraseña-de-relleno");
    }

    @Transactional
    public LoginResponse login(LoginRequest req, String ip) {
        String username = req.username().trim();
        attempts.lockedMinutes(username, ip).ifPresent(min -> {
            throw new BusinessException("Demasiados intentos fallidos. Espere " + min
                    + (min == 1 ? " minuto" : " minutos") + " e intente de nuevo.", HttpStatus.TOO_MANY_REQUESTS);
        });
        Optional<AppUser> found = users.findByUsernameIgnoreCase(username);
        boolean ok = encoder.matches(req.password(), found.map(AppUser::getPasswordHash).orElse(dummyHash));
        if (found.isEmpty() || !ok) {
            attempts.failed(username, ip);
            throw new BusinessException(BAD_CREDENTIALS, HttpStatus.UNAUTHORIZED);
        }
        attempts.succeeded(username);
        AppUser u = found.get();
        if (!u.isActive()) {
            throw new BusinessException("Su usuario está inactivo. Hable con el administrador.", HttpStatus.UNAUTHORIZED);
        }
        JwtService.Token token = jwt.generate(u);
        audit.log(u, "INICIO_SESION", "user", u.getId(), Map.of("usuario", u.getUsername()));
        return new LoginResponse(token.value(), token.expiresAt(), UserDto.of(u), pending(u));
    }

    private boolean pending(AppUser u) {
        return u.getPrivacyAcceptedAt() == null || !privacyVersion.equals(u.getPrivacyVersion());
    }

    @Transactional(readOnly = true)
    public PrivacyStatusDto privacyStatus() {
        AppUser u = requireUser();
        return new PrivacyStatusDto(privacyVersion, u.getPrivacyAcceptedAt(), pending(u));
    }

    /**
     * Autorización del titular (Ley 1581 de 2012, art. 9; Decreto 1377 de 2013, arts. 7 y 8):
     * se guarda la fecha y la versión aceptada, y queda en la auditoría con la IP como prueba.
     */
    @Transactional
    public PrivacyStatusDto acceptPrivacy(String ip) {
        AppUser u = requireUser();
        u.acceptPrivacy(privacyVersion, Instant.now());
        audit.log(u, "ACEPTAR_POLITICA_DATOS", "user", u.getId(),
                Map.of("usuario", u.getUsername(), "version", privacyVersion, "ip", ip == null ? "" : ip));
        return new PrivacyStatusDto(privacyVersion, u.getPrivacyAcceptedAt(), false);
    }

    private AppUser requireUser() {
        return users.findById(currentUser.require().id())
                .orElseThrow(() -> new BusinessException("Debe iniciar sesión para continuar.", HttpStatus.UNAUTHORIZED));
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
