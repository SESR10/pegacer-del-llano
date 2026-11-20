package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.ProductDto;
import co.pegacer.sistema.dto.ProductRequest;
import co.pegacer.sistema.entity.MovementType;
import co.pegacer.sistema.entity.Product;
import co.pegacer.sistema.exception.BusinessException;
import co.pegacer.sistema.repository.AlertRepository;
import co.pegacer.sistema.repository.InventoryMovementRepository;
import co.pegacer.sistema.repository.ProductCategoryRepository;
import co.pegacer.sistema.repository.ProductRepository;
import co.pegacer.sistema.repository.UnitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ProductService {
    private final ProductRepository products;
    private final ProductCategoryRepository categories;
    private final UnitRepository units;
    private final InventoryMovementRepository movements;
    private final InventoryService inventory;
    private final AlertService alerts;
    private final AlertRepository alertRepo;
    private final AuditService audit;

    public ProductService(ProductRepository products, ProductCategoryRepository categories, UnitRepository units,
                          InventoryMovementRepository movements, InventoryService inventory, AlertService alerts,
                          AlertRepository alertRepo, AuditService audit) {
        this.products = products;
        this.categories = categories;
        this.units = units;
        this.movements = movements;
        this.inventory = inventory;
        this.alerts = alerts;
        this.alertRepo = alertRepo;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<ProductDto> list(String category, boolean includeInactive) {
        return products.search(category, includeInactive).stream().map(ProductDto::of).toList();
    }

    @Transactional(readOnly = true)
    public ProductDto get(Long id) { return ProductDto.of(find(id)); }

    @Transactional
    public ProductDto create(ProductRequest req) {
        String code = req.code().trim().toUpperCase(Locale.ROOT);
        if (products.existsByCodeIgnoreCase(code)) {
            throw new BusinessException("Ya existe un producto con el código " + code + ".", HttpStatus.CONFLICT);
        }
        Product p = new Product();
        p.setCode(code);
        apply(p, req);
        p = products.save(p);
        if (req.initialStock() != null && req.initialStock().signum() > 0) {
            inventory.register(p.getId(), MovementType.INICIAL, req.initialStock(), null, null, "Saldo inicial al crear el producto");
        } else {
            alerts.checkStock(p);
        }
        audit.log("CREAR_PRODUCTO", "product", p.getId(), details(p));
        return ProductDto.of(p);
    }

    /** Edita datos del producto. El código y el stock no se cambian aquí. */
    @Transactional
    public ProductDto update(Long id, ProductRequest req) {
        Product p = find(id);
        if (!p.getCode().equalsIgnoreCase(req.code().trim())) {
            throw new BusinessException("El código de un producto no se puede cambiar.");
        }
        apply(p, req);
        alerts.checkStock(p);
        audit.log("EDITAR_PRODUCTO", "product", p.getId(), details(p));
        return ProductDto.of(p);
    }

    /**
     * Elimina el producto. Si ya tiene movimientos en el kardex no se borra (se perdería la historia):
     * se desactiva y deja de aparecer en las listas.
     */
    @Transactional
    public String delete(Long id) {
        Product p = find(id);
        if (movements.existsByProductId(id) || p.getStock().signum() > 0) {
            p.setActive(false);
            audit.log("DESACTIVAR_PRODUCTO", "product", id, details(p));
            return "El producto tiene historial de inventario, así que se desactivó en lugar de borrarse.";
        }
        audit.log("ELIMINAR_PRODUCTO", "product", id, details(p));
        alertRepo.deleteByProductId(id);
        products.delete(p);
        products.flush();
        return "Producto eliminado.";
    }

    private void apply(Product p, ProductRequest req) {
        p.setName(req.name().trim());
        p.setCategory(categories.findByCode(req.category().trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException("La categoría " + req.category() + " no existe.")));
        p.setUnit(units.findByCode(req.unit().trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException("La unidad de medida " + req.unit() + " no existe.")));
        p.setMinStock(req.minStock());
        p.setUnitCost(req.unitCost());
    }

    private Product find(Long id) {
        return products.findById(id).orElseThrow(() -> new BusinessException("El producto no existe.", HttpStatus.NOT_FOUND));
    }

    private static Map<String, Object> details(Product p) {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("codigo", p.getCode());
        d.put("nombre", p.getName());
        d.put("categoria", p.getCategory().getCode());
        d.put("unidad", p.getUnit().getCode());
        d.put("stockMinimo", p.getMinStock());
        return d;
    }
}
