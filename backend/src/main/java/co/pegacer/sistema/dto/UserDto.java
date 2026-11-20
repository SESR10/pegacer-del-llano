package co.pegacer.sistema.dto;

import co.pegacer.sistema.entity.AppUser;

public record UserDto(Long id, String username, String fullName, String email, String role, String roleName,
                      boolean active) {
    public static UserDto of(AppUser u) {
        return new UserDto(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getRole().getCode(),
                u.getRole().getName(), u.isActive());
    }
}
