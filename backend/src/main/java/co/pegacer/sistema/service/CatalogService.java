package co.pegacer.sistema.service;

import co.pegacer.sistema.dto.CatalogsDto;
import co.pegacer.sistema.dto.CatalogsDto.Item;
import co.pegacer.sistema.entity.MovementType;
import co.pegacer.sistema.entity.Setting;
import co.pegacer.sistema.exception.BusinessException;
import org.springframework.http.HttpStatus;
import co.pegacer.sistema.repository.ProductCategoryRepository;
import co.pegacer.sistema.repository.RoleRepository;
import co.pegacer.sistema.repository.SettingRepository;
import co.pegacer.sistema.repository.UnitRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final ProductCategoryRepository categories;
    private final UnitRepository units;
    private final RoleRepository roles;
    private final SettingRepository settings;
    private final AuditService audit;

    public CatalogService(ProductCategoryRepository categories, UnitRepository units, RoleRepository roles,
                          SettingRepository settings, AuditService audit) {
        this.audit = audit;
        this.categories = categories;
        this.units = units;
        this.roles = roles;
        this.settings = settings;
    }

    public CatalogsDto catalogs() {
        Sort byId = Sort.by("id");
        return new CatalogsDto(
                categories.findAll(byId).stream().map(c -> new Item(c.getCode(), c.getName())).toList(),
                units.findAll(byId).stream().map(u -> new Item(u.getCode(), u.getName())).toList(),
                roles.findAll(byId).stream().map(r -> new Item(r.getCode(), r.getName())).toList(),
                List.of(MovementType.AJUSTE_POS.name(), MovementType.AJUSTE_NEG.name()));
    }

    public Map<String, String> settings() {
        Map<String, String> out = new LinkedHashMap<>();
        settings.findAll(Sort.by("key")).forEach((Setting s) -> out.put(s.getKey(), s.getValue()));
        return out;
    }

    /** Cambia un parámetro del sistema. Por ahora solo la tolerancia de consumo, con su validación. */
    @Transactional
    public Map<String, String> updateSetting(String key, String value) {
        Setting s = settings.findById(key)
                .orElseThrow(() -> new BusinessException("El parámetro " + key + " no existe.", HttpStatus.NOT_FOUND));
        String v = value.trim().replace(',', '.');
        if ("consumo.tolerancia_pct".equals(key)) {
            try {
                java.math.BigDecimal n = new java.math.BigDecimal(v);
                if (n.signum() <= 0 || n.compareTo(java.math.BigDecimal.valueOf(50)) > 0) throw new NumberFormatException();
                v = n.stripTrailingZeros().toPlainString();
            } catch (NumberFormatException e) {
                throw new BusinessException("La tolerancia debe ser un número mayor que 0 y hasta 50 (%).");
            }
        }
        if ("costo.otros_por_cochada".equals(key)) {
            try {
                java.math.BigDecimal n = new java.math.BigDecimal(v);
                if (n.signum() < 0) throw new NumberFormatException();
                v = n.stripTrailingZeros().toPlainString();
            } catch (NumberFormatException e) {
                throw new BusinessException("Los otros costos deben ser un valor en pesos mayor o igual a cero.");
            }
        }
        String before = s.getValue();
        s.setValue(v);
        audit.log("CAMBIAR_PARAMETRO", "setting", null, Map.of("parametro", key, "antes", before, "despues", v));
        return settings();
    }
}
