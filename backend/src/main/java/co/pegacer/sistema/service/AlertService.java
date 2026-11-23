package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.AlertDto;
import co.pegacer.sistema.entity.Alert;
import co.pegacer.sistema.entity.Product;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.AlertRepository;
import co.pegacer.sistema.security.CurrentUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class AlertService {
    static final List<String> STOCK_TYPES = List.of("STOCK_CRITICO", "AGOTADO");

    private final AlertRepository repo;
    private final AuditService audit;
    private final CurrentUser currentUser;

    public AlertService(AlertRepository repo, AuditService audit, CurrentUser currentUser) {
        this.repo = repo;
        this.audit = audit;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<AlertDto> list(Boolean resolved) {
        // Las atendidas pueden ser muchas con el tiempo: se devuelven las 200 más recientes.
        if (Boolean.TRUE.equals(resolved)) return repo.recentlyResolved(PageRequest.of(0, 200)).stream().map(AlertDto::of).toList();
        return repo.search(resolved).stream().map(AlertDto::of).toList();
    }

    @Transactional
    public AlertDto resolve(Long id) {
        Alert a = repo.findById(id).orElseThrow(() -> new BusinessException("La alerta no existe.", HttpStatus.NOT_FOUND));
        if (!a.isResolved()) {
            a.resolve(currentUser.entityOrNull());
            audit.log("RESOLVER_ALERTA", "alert", id, Map.of("tipo", a.getAlertType(), "mensaje", a.getMessage()));
        }
        return AlertDto.of(a);
    }

    /** Atender varias alertas de una vez (por ejemplo, todas las de un filtro). Devuelve cuántas se cerraron. */
    @Transactional
    public int resolveMany(List<Long> ids) {
        int n = 0;
        for (Alert a : repo.findAllById(ids)) {
            if (a.isResolved()) continue;
            a.resolve(currentUser.entityOrNull());
            n++;
        }
        if (n > 0) audit.log("RESOLVER_ALERTAS", "alert", null, Map.of("cantidad", n, "ids", ids));
        return n;
    }

    /**
     * Revisa el stock de un producto después de un movimiento:
     * crea la alerta si quedó por debajo del mínimo (o agotado) y cierra las alertas de stock si se recuperó.
     */
    @Transactional
    public void checkStock(Product p) {
        List<Alert> open = repo.findByProductIdAndAlertTypeInAndResolvedFalse(p.getId(), STOCK_TYPES);
        boolean empty = p.getStock().signum() == 0;
        boolean low = p.getStock().compareTo(p.getMinStock()) < 0;
        if (!empty && !low) {
            open.forEach(a -> a.resolve(null));
            return;
        }
        String type = empty ? "AGOTADO" : "STOCK_CRITICO";
        if (open.stream().anyMatch(a -> a.getAlertType().equals(type))) return;
        open.forEach(a -> a.resolve(null));  // ej: pasó de crítico a agotado
        String msg = empty ? p.getName() + " está agotado."
                : p.getName() + " en stock crítico: quedan " + fmt(p.getStock()) + " (mínimo " + fmt(p.getMinStock()) + ").";
        repo.save(new Alert(type, "ALTA", p, null, msg));
    }

    private static String fmt(BigDecimal n) { return n.stripTrailingZeros().toPlainString(); }
}
