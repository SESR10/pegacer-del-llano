package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.FormulaDto;
import co.pegacer.sistema.dto.FormulaRequest;
import co.pegacer.sistema.entity.Formula;
import co.pegacer.sistema.entity.FormulaItem;
import co.pegacer.sistema.entity.Product;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.FormulaRepository;
import co.pegacer.sistema.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Fórmulas (Fase 9). Una fórmula nunca se sobrescribe: guardar cambios crea la versión siguiente y desactiva
 * la anterior. Las cochadas ya registradas siguen apuntando a la versión con la que se hicieron.
 */
@Service
public class FormulaService {
    private final FormulaRepository formulas;
    private final ProductRepository products;
    private final AuditService audit;

    public FormulaService(FormulaRepository formulas, ProductRepository products, AuditService audit) {
        this.formulas = formulas;
        this.products = products;
        this.audit = audit;
    }

    @Transactional
    public FormulaDto save(FormulaRequest req) {
        Product product = products.findById(req.productId())
                .orElseThrow(() -> new BusinessException("El producto no existe.", HttpStatus.NOT_FOUND));
        if (!"PRODUCTO_TERMINADO".equals(product.getCategory().getCode())) {
            throw new BusinessException("Las fórmulas son para productos terminados. " + product.getName() + " no lo es.");
        }
        if (!product.isActive()) throw new BusinessException(product.getName() + " está inactivo.");
        if (req.minBags().compareTo(req.maxBags()) > 0) {
            throw new BusinessException("El mínimo de bolsas no puede ser mayor que el máximo.");
        }
        if (req.expectedBags().compareTo(req.minBags()) < 0 || req.expectedBags().compareTo(req.maxBags()) > 0) {
            throw new BusinessException("Las bolsas esperadas deben estar entre el mínimo y el máximo.");
        }

        Set<Long> seen = new HashSet<>();
        List<Product> materials = new ArrayList<>();
        for (FormulaRequest.Item i : req.items()) {
            if (!seen.add(i.productId())) throw new BusinessException("Hay un material repetido en la fórmula.");
            Product m = products.findById(i.productId())
                    .orElseThrow(() -> new BusinessException("Uno de los materiales no existe.", HttpStatus.NOT_FOUND));
            if ("PRODUCTO_TERMINADO".equals(m.getCategory().getCode())) {
                throw new BusinessException(m.getName() + " es un producto terminado: no puede ser material de una fórmula.");
            }
            if (!m.isActive()) throw new BusinessException(m.getName() + " está inactivo.");
            materials.add(m);
        }

        List<Formula> previous = formulas.findByProductIdAndActiveTrue(product.getId());
        previous.forEach(f -> f.setActive(false));
        formulas.flush();

        Formula f = new Formula(product, req.name().trim(), formulas.maxVersion(product.getId()) + 1,
                req.expectedBags(), req.minBags(), req.maxBags(), req.bagWeightKg());
        for (int i = 0; i < materials.size(); i++) {
            f.getItems().add(new FormulaItem(f, materials.get(i), req.items().get(i).quantity()));
        }
        f = formulas.save(f);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("producto", product.getCode());
        details.put("nombre", f.getName());
        details.put("version", f.getVersion());
        details.put("reemplaza", previous.stream().map(Formula::getVersion).toList());
        details.put("bolsas", Map.of("min", req.minBags(), "esperado", req.expectedBags(), "max", req.maxBags()));
        Map<String, BigDecimal> items = new LinkedHashMap<>();
        for (int i = 0; i < materials.size(); i++) items.put(materials.get(i).getCode(), req.items().get(i).quantity());
        details.put("materiales", items);
        audit.log(previous.isEmpty() ? "CREAR_FORMULA" : "NUEVA_VERSION_FORMULA", "formula", f.getId(), details);
        return FormulaDto.of(f);
    }

    /** Vuelve a usar una versión anterior: queda activa y se desactiva la que estaba en uso. */
    @Transactional
    public FormulaDto activate(Long id) {
        Formula f = formulas.findById(id).orElseThrow(() -> new BusinessException("La fórmula no existe.", HttpStatus.NOT_FOUND));
        if (f.isActive()) return FormulaDto.of(f);
        formulas.findByProductIdAndActiveTrue(f.getProduct().getId()).forEach(o -> o.setActive(false));
        formulas.flush();
        f.setActive(true);
        audit.log("ACTIVAR_FORMULA", "formula", id, Map.of("producto", f.getProduct().getCode(), "version", f.getVersion()));
        return FormulaDto.of(f);
    }
}
