package co.pegacer.sistema.config;

import co.pegacer.sistema.entity.AppUser;
import co.pegacer.sistema.repository.RoleRepository;
import co.pegacer.sistema.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Perfil de producción (sin datos DEMO).
 * <ul>
 *   <li>No arranca con el secreto JWT de desarrollo: hay que definir JWT_SECRET (32 caracteres o más).</li>
 *   <li>No arranca sobre una base con usuarios DEMO activos.</li>
 *   <li>Si la base no tiene ningún usuario, crea el primer Administrador con ADMIN_USUARIO y ADMIN_CONTRASENA.
 *       Los demás usuarios se crean desde la pantalla Usuarios. Con usuarios ya creados, esas variables no se usan.</li>
 * </ul>
 */
@Component
@Profile("prod")
public class ArranqueProduccion implements ApplicationRunner {
    static final String SECRETO_DESARROLLO = "cambiar-este-secreto-de-desarrollo-minimo-32-caracteres";
    static final int LARGO_MINIMO_CONTRASENA = 10;

    private static final Logger log = LoggerFactory.getLogger(ArranqueProduccion.class);

    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder encoder;
    private final String jwtSecret;
    private final String adminUsuario;
    private final String adminContrasena;
    private final String adminNombre;

    public ArranqueProduccion(UserRepository users, RoleRepository roles, PasswordEncoder encoder,
                              @Value("${app.jwt.secret}") String jwtSecret,
                              @Value("${app.admin.usuario:}") String adminUsuario,
                              @Value("${app.admin.contrasena:}") String adminContrasena,
                              @Value("${app.admin.nombre:Administrador}") String adminNombre) {
        this.users = users;
        this.roles = roles;
        this.encoder = encoder;
        this.jwtSecret = jwtSecret;
        this.adminUsuario = adminUsuario;
        this.adminContrasena = adminContrasena;
        this.adminNombre = adminNombre;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (jwtSecret == null || jwtSecret.equals(SECRETO_DESARROLLO) || jwtSecret.length() < 32) {
            throw new IllegalStateException(
                    "Perfil prod: defina la variable JWT_SECRET con un texto secreto de 32 caracteres o más.");
        }
        if (users.findAll().stream().anyMatch(u -> u.isDemo() && u.isActive())) {
            throw new IllegalStateException(
                    "Perfil prod: la base tiene usuarios DEMO activos. Use una base nueva para producción.");
        }
        if (users.count() > 0) {
            if (!adminContrasena.isBlank()) {
                log.warn("Ya hay usuarios: ADMIN_CONTRASENA no se usa. Puede borrar esa variable.");
            }
            return;
        }
        if (adminUsuario.isBlank() || adminContrasena.length() < LARGO_MINIMO_CONTRASENA) {
            throw new IllegalStateException("Perfil prod: la base no tiene usuarios. Defina ADMIN_USUARIO y "
                    + "ADMIN_CONTRASENA (" + LARGO_MINIMO_CONTRASENA
                    + " caracteres o más) para crear el primer Administrador.");
        }
        AppUser admin = new AppUser();
        admin.setUsername(adminUsuario.trim().toLowerCase(Locale.ROOT));
        admin.setFullName(adminNombre.isBlank() ? "Administrador" : adminNombre.trim());
        admin.setPasswordHash(encoder.encode(adminContrasena));
        admin.setRole(roles.findByCode("ADMIN").orElseThrow());
        users.save(admin);
        log.info("Primer Administrador creado: {}. Ya puede borrar ADMIN_CONTRASENA de las variables.",
                admin.getUsername());
    }
}
