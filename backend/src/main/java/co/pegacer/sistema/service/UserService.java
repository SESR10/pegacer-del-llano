package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.UserCreateRequest;
import co.pegacer.sistema.dto.UserDto;
import co.pegacer.sistema.dto.UserUpdateRequest;
import co.pegacer.sistema.entity.AppUser;
import co.pegacer.sistema.entity.Role;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.RoleRepository;
import co.pegacer.sistema.repository.UserRepository;
import co.pegacer.sistema.security.CurrentUser;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Administración de usuarios (solo ADMIN). */
@Service
public class UserService {
    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder encoder;
    private final AuditService audit;
    private final CurrentUser currentUser;

    public UserService(UserRepository users, RoleRepository roles, PasswordEncoder encoder, AuditService audit,
                       CurrentUser currentUser) {
        this.users = users;
        this.roles = roles;
        this.encoder = encoder;
        this.audit = audit;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<UserDto> list() { return users.findAll(Sort.by("username")).stream().map(UserDto::of).toList(); }

    @Transactional
    public UserDto create(UserCreateRequest req) {
        String username = req.username().trim().toLowerCase(Locale.ROOT);
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new BusinessException("Ya existe el usuario " + username + ".", HttpStatus.CONFLICT);
        }
        AppUser u = new AppUser();
        u.setUsername(username);
        u.setFullName(req.fullName().trim());
        u.setEmail(blankToNull(req.email()));
        u.setRole(role(req.role()));
        u.setPasswordHash(encoder.encode(req.password()));
        u = users.save(u);
        audit.log("CREAR_USUARIO", "user", u.getId(), details(u));
        return UserDto.of(u);
    }

    @Transactional
    public UserDto update(Long id, UserUpdateRequest req) {
        AppUser u = users.findById(id).orElseThrow(() -> new BusinessException("El usuario no existe.", HttpStatus.NOT_FOUND));
        Role newRole = role(req.role());
        boolean self = currentUser.get().map(c -> c.id().equals(id)).orElse(false);
        if (self && (!req.active() || !"ADMIN".equals(newRole.getCode()))) {
            throw new BusinessException("No puede quitarse a sí mismo el rol de administrador ni desactivar su propio usuario.");
        }
        u.setFullName(req.fullName().trim());
        u.setEmail(blankToNull(req.email()));
        u.setRole(newRole);
        u.setActive(req.active());
        Map<String, Object> d = details(u);
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(encoder.encode(req.password()));
            d.put("contrasenaCambiada", true);
        }
        audit.log("EDITAR_USUARIO", "user", u.getId(), d);
        return UserDto.of(u);
    }

    private Role role(String code) {
        return roles.findByCode(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException("El rol " + code + " no existe."));
    }

    private static Map<String, Object> details(AppUser u) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("usuario", u.getUsername());
        d.put("rol", u.getRole().getCode());
        d.put("activo", u.isActive());
        return d;
    }

    private static String blankToNull(String v) { return v == null || v.isBlank() ? null : v.trim(); }
}
