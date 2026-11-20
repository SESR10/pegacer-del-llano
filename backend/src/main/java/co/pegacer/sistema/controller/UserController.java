package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.*;
import co.pegacer.sistema.security.Roles;
import co.pegacer.sistema.service.AuditService;
import co.pegacer.sistema.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Usuarios y auditoría (solo administrador)")
@RestController
@RequestMapping("/api")
@PreAuthorize(Roles.ADMIN)
public class UserController {
    private final UserService users;
    private final AuditService audit;

    public UserController(UserService users, AuditService audit) {
        this.users = users;
        this.audit = audit;
    }

    @GetMapping("/users")
    public ApiResponse<List<UserDto>> list() { return ApiResponse.ok(users.list()); }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserDto> create(@Valid @RequestBody UserCreateRequest req) {
        return ApiResponse.ok("Usuario creado.", users.create(req));
    }

    @PutMapping("/users/{id}")
    public ApiResponse<UserDto> update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest req) {
        return ApiResponse.ok("Usuario actualizado.", users.update(id, req));
    }

    @GetMapping("/audit")
    public ApiResponse<PageDto<AuditDto>> audit(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.ok(audit.list(Math.max(page, 0), Pagination.size(size)));
    }
}
