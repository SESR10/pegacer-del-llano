package co.pegacer.sistema.config;

import co.pegacer.sistema.entity.AppUser;
import co.pegacer.sistema.entity.Role;
import co.pegacer.sistema.repository.RoleRepository;
import co.pegacer.sistema.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/** Perfil prod: secreto JWT obligatorio y creación del primer Administrador. */
class ArranqueProduccionTests {
    private static final String SECRETO = "un-secreto-de-produccion-de-mas-de-32-caracteres";

    private final UserRepository users = mock(UserRepository.class);
    private final RoleRepository roles = mock(RoleRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private ArranqueProduccion arranque(String secreto, String usuario, String contrasena) {
        return new ArranqueProduccion(users, roles, encoder, secreto, usuario, contrasena, "Santiago");
    }

    @Test
    void noArrancaConElSecretoDeDesarrollo() {
        assertThatThrownBy(() -> arranque(ArranqueProduccion.SECRETO_DESARROLLO, "s", "ClaveSegura2026").run(null))
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void sinUsuariosExigeElPrimerAdministrador() {
        when(users.count()).thenReturn(0L);
        assertThatThrownBy(() -> arranque(SECRETO, "", "").run(null)).hasMessageContaining("ADMIN_USUARIO");
        assertThatThrownBy(() -> arranque(SECRETO, "santiago", "corta").run(null)).hasMessageContaining("10 caracteres");
        verify(users, never()).save(any());
    }

    @Test
    void creaElPrimerAdministrador() {
        when(users.count()).thenReturn(0L);
        when(roles.findByCode("ADMIN")).thenReturn(Optional.of(new Role()));
        arranque(SECRETO, " Santiago ", "ClaveSegura2026").run(null);
        ArgumentCaptor<AppUser> creado = ArgumentCaptor.forClass(AppUser.class);
        verify(users).save(creado.capture());
        assertThat(creado.getValue().getUsername()).isEqualTo("santiago");
        assertThat(encoder.matches("ClaveSegura2026", creado.getValue().getPasswordHash())).isTrue();
    }

    @Test
    void conUsuariosNoCreaNada() {
        when(users.findAll()).thenReturn(List.of(new AppUser()));
        when(users.count()).thenReturn(1L);
        arranque(SECRETO, "otro", "ClaveSegura2026").run(null);
        verify(users, never()).save(any());
    }
}
