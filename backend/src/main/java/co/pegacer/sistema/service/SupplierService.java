package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.SupplierDto;
import co.pegacer.sistema.dto.SupplierRequest;
import co.pegacer.sistema.entity.Supplier;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.SupplierRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class SupplierService {
    private final SupplierRepository repo;
    private final AuditService audit;

    public SupplierService(SupplierRepository repo, AuditService audit) {
        this.repo = repo;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<SupplierDto> list() { return repo.findAllByOrderByNameAsc().stream().map(SupplierDto::of).toList(); }

    @Transactional
    public SupplierDto create(SupplierRequest req) {
        String nit = req.nit().trim();
        if (repo.existsByNitIgnoreCase(nit)) {
            throw new BusinessException("Ya existe un proveedor con el NIT " + nit + ".", HttpStatus.CONFLICT);
        }
        Supplier s = new Supplier();
        s.setNit(nit);
        apply(s, req);
        s = repo.save(s);
        audit.log("CREAR_PROVEEDOR", "supplier", s.getId(), Map.of("nit", s.getNit(), "nombre", s.getName()));
        return SupplierDto.of(s);
    }

    @Transactional
    public SupplierDto update(Long id, SupplierRequest req) {
        Supplier s = repo.findById(id).orElseThrow(() -> new BusinessException("El proveedor no existe.", HttpStatus.NOT_FOUND));
        String nit = req.nit().trim();
        if (!s.getNit().equalsIgnoreCase(nit) && repo.existsByNitIgnoreCase(nit)) {
            throw new BusinessException("Ya existe un proveedor con el NIT " + nit + ".", HttpStatus.CONFLICT);
        }
        s.setNit(nit);
        apply(s, req);
        audit.log("EDITAR_PROVEEDOR", "supplier", s.getId(), Map.of("nit", s.getNit(), "nombre", s.getName()));
        return SupplierDto.of(s);
    }

    private static void apply(Supplier s, SupplierRequest req) {
        s.setName(req.name().trim());
        s.setPhone(blankToNull(req.phone()));
        s.setEmail(blankToNull(req.email()));
        s.setCity(blankToNull(req.city()));
        if (req.active() != null) s.setActive(req.active());
    }

    private static String blankToNull(String v) { return v == null || v.isBlank() ? null : v.trim(); }
}
