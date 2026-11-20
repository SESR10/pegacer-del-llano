package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.AlertDto;
import co.pegacer.sistema.entity.Alert;
import co.pegacer.sistema.entity.Product;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.AlertRepository;
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

    public AlertService(AlertRepository repo, AuditService audit) {
        this.repo = repo;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<AlertDto> list(Boolean resolved) {
        return repo.search(resolved).stream().map(AlertDto::of).toList();
    }

    @Transactional
    public AlertDto resolve(Long id) {
        Alert a = repo.findById(id).orElseThrow(() -> new BusinessException("La alerta no existe.", HttpStatus.NOT_FOUND));
        if (!a.isResolved()) {
            a.setResolved(true);
            audit.log("RESOLVER_ALERTA", "alert", id, Map.of("tipo", a.getAlertType(), "mensaje", a.getMessage()));
        }
        return AlertDto.of(a);
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
            open.forEach(a -> a.setResolved(true));
            return;
        }
        String type = empty ? "AGOTADO" : "STOCK_CRITICO";
        if (open.stream().anyMatch(a -> a.getAlertType().equals(type))) return;
        open.forEach(a -> a.setResolved(true));  // ej: pasó de crítico a agotado
        String msg = empty ? p.getName() + " está agotado."
                : p.getName() + " en stock crítico: quedan " + fmt(p.getStock()) + " (mínimo " + fmt(p.getMinStock()) + ").";
        repo.save(new Alert(type, "ALTA", p, null, msg));
    }

    private static String fmt(BigDecimal n) { return n.stripTrailingZeros().toPlainString(); }
}
