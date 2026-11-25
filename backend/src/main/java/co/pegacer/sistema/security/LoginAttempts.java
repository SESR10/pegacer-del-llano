package co.pegacer.sistema.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Límite de intentos de inicio de sesión, contra quien intente adivinar contraseñas.
 * <ul>
 *   <li>Por usuario: tras {@code max-por-usuario} intentos fallidos, ese usuario queda bloqueado {@code bloqueo-minutos}.</li>
 *   <li>Por dirección IP: tras {@code max-por-ip} intentos fallidos (con cualquier usuario), esa IP queda bloqueada.</li>
 * </ul>
 * Un inicio de sesión correcto borra los fallos del usuario. Se guarda en memoria: un reinicio del servidor
 * los borra, lo cual es aceptable para un solo servidor (Railway).
 */
@Component
public class LoginAttempts {
    private static final Logger log = LoggerFactory.getLogger(LoginAttempts.class);

    private record Counter(int failures, Instant firstFailure, Instant lockedUntil) { }

    private final Map<String, Counter> counters = new ConcurrentHashMap<>();
    private final int maxPerUser;
    private final int maxPerIp;
    private final Duration window;
    private final Clock clock;

    @Autowired
    public LoginAttempts(@Value("${app.login.max-por-usuario:5}") int maxPerUser,
                         @Value("${app.login.max-por-ip:20}") int maxPerIp,
                         @Value("${app.login.bloqueo-minutos:15}") long lockMinutes) {
        this(maxPerUser, maxPerIp, Duration.ofMinutes(lockMinutes), Clock.systemUTC());
    }

    LoginAttempts(int maxPerUser, int maxPerIp, Duration window, Clock clock) {
        this.maxPerUser = maxPerUser;
        this.maxPerIp = maxPerIp;
        this.window = window;
        this.clock = clock;
    }

    /** Minutos que faltan de bloqueo para este usuario o esta IP, o vacío si puede intentar. */
    public Optional<Long> lockedMinutes(String username, String ip) {
        Instant now = clock.instant();
        return remaining(userKey(username), now).or(() -> remaining(ipKey(ip), now))
                .map(d -> Math.max(1, (d.toSeconds() + 59) / 60));
    }

    public void failed(String username, String ip) {
        Instant now = clock.instant();
        add(userKey(username), maxPerUser, now, "usuario " + username);
        add(ipKey(ip), maxPerIp, now, "IP " + ip);
        // Limpieza simple para que el mapa no crezca sin fin con usuarios inventados.
        if (counters.size() > 10_000) counters.values().removeIf(c -> expired(c, now));
    }

    public void succeeded(String username) {
        counters.remove(userKey(username));
    }

    /** Solo para pruebas. */
    public void reset() { counters.clear(); }

    private void add(String key, int max, Instant now, String who) {
        Counter c = counters.compute(key, (k, old) -> {
            if (old == null || expired(old, now)) return new Counter(1, now, null);
            int n = old.failures() + 1;
            return new Counter(n, old.firstFailure(), n >= max ? now.plus(window) : old.lockedUntil());
        });
        if (c.failures() == max) {
            log.warn("Inicio de sesión bloqueado {} min para {} por {} intentos fallidos.", window.toMinutes(), who, max);
        }
    }

    private Optional<Duration> remaining(String key, Instant now) {
        Counter c = counters.get(key);
        if (c == null || c.lockedUntil() == null || !c.lockedUntil().isAfter(now)) return Optional.empty();
        return Optional.of(Duration.between(now, c.lockedUntil()));
    }

    private boolean expired(Counter c, Instant now) {
        Instant end = c.lockedUntil() != null ? c.lockedUntil() : c.firstFailure().plus(window);
        return !end.isAfter(now);
    }

    private static String userKey(String username) { return "u:" + username.trim().toLowerCase(Locale.ROOT); }
    private static String ipKey(String ip) { return "ip:" + (ip == null ? "?" : ip); }
}
