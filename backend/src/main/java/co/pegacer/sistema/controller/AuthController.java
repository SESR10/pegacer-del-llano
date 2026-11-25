package co.pegacer.sistema.controller;

import co.pegacer.sistema.dto.*;
import co.pegacer.sistema.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Autenticación")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @Operation(summary = "Iniciar sesión", description = "Devuelve el token JWT que se envía como 'Authorization: Bearer <token>'.")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return ApiResponse.ok("Bienvenido.", auth.login(req, http.getRemoteAddr()));
    }

    @Operation(summary = "Estado de mi autorización de tratamiento de datos (Ley 1581 de 2012)")
    @GetMapping("/privacy")
    public ApiResponse<PrivacyStatusDto> privacy() { return ApiResponse.ok(auth.privacyStatus()); }

    @Operation(summary = "Aceptar la Política de Tratamiento de Datos vigente")
    @PostMapping("/privacy/accept")
    public ApiResponse<PrivacyStatusDto> acceptPrivacy(HttpServletRequest http) {
        return ApiResponse.ok("Autorización registrada.", auth.acceptPrivacy(http.getRemoteAddr()));
    }

    @Operation(summary = "Usuario de la sesión actual")
    @GetMapping("/me")
    public ApiResponse<UserDto> me() { return ApiResponse.ok(auth.me()); }

    @Operation(summary = "Cambiar mi contraseña")
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        auth.changePassword(req);
        return ApiResponse.ok("Contraseña actualizada.", null);
    }
}
