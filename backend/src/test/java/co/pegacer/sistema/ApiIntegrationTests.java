package co.pegacer.sistema;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de las Fases 3 y 4: login, permisos por rol, productos, kardex, alertas y auditoría.
 * Cada prueba corre en una transacción que se deshace al final, así no se afectan entre sí.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"demo", "test"})
@Import(TestDatabaseConfig.class)
@Transactional
class ApiIntegrationTests {
    static final String PASSWORD = "Demo2026*";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;

    /** Las pruebas leen con SQL directo: primero se envían a la base los cambios pendientes de JPA. */
    <T> T q(String sql, Class<T> type, Object... args) {
        em.flush();
        return jdbc.queryForObject(sql, type, args);
    }

    void u(String sql, Object... args) {
        em.flush();
        jdbc.update(sql, args);
        em.clear();
    }

    String token(String username) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).at("/data/token").asText();
    }

    MockHttpServletRequestBuilder as(String user, MockHttpServletRequestBuilder req) throws Exception {
        return req.header("Authorization", "Bearer " + token(user)).contentType(MediaType.APPLICATION_JSON);
    }

    long productId(String code) {
        return q("SELECT id FROM products WHERE code = ?", Long.class, code);
    }

    BigDecimal stock(String code) {
        return q("SELECT stock FROM products WHERE code = ?", BigDecimal.class, code);
    }

    // ---------- Fase 4: autenticación ----------

    /** Publicado detrás de un proxy HTTPS (Railway): la pantalla y el API comparten dirección. */
    @Test
    void loginWorksBehindHttpsProxy() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .with(r -> { r.setServerName("pegacer.up.railway.app"); r.setServerPort(8080); return r; })
                        .header("Origin", "https://pegacer.up.railway.app")
                        .header("X-Forwarded-Proto", "https")
                        .header("X-Forwarded-Host", "pegacer.up.railway.app")
                        .content("{\"username\":\"admin\",\"password\":\"" + PASSWORD + "\"}"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void loginReturnsTokenAndUser() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ADMIN\",\"password\":\"" + PASSWORD + "\"}"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.token").isNotEmpty())
           .andExpect(jsonPath("$.data.user.role").value("ADMIN"))
           .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist());
        assertThat(q("SELECT count(*) FROM audit_log WHERE action = 'INICIO_SESION'", Integer.class)).isPositive();
    }

    @Test
    void wrongPasswordAndUnknownUserGiveSameMessage() throws Exception {
        for (String body : new String[]{"{\"username\":\"admin\",\"password\":\"mala\"}",
                                        "{\"username\":\"nadie\",\"password\":\"mala\"}"}) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
               .andExpect(status().isUnauthorized())
               .andExpect(jsonPath("$.success").value(false))
               .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos."));
        }
    }

    @Test
    void emptyLoginIsValidated() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"\",\"password\":\"\"}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void invalidTokenIsRejected() throws Exception {
        mvc.perform(get("/api/products").header("Authorization", "Bearer token-falso"))
           .andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.message").value("Debe iniciar sesión para continuar."));
    }

    @Test
    void meReturnsSessionUser() throws Exception {
        mvc.perform(as("produccion", get("/api/auth/me")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.username").value("produccion"))
           .andExpect(jsonPath("$.data.role").value("PRODUCCION"));
    }

    @Test
    void inactiveUserCannotLoginNorUseOldToken() throws Exception {
        String t = token("compras");
        u("UPDATE users SET active = FALSE WHERE username = 'compras'");
        mvc.perform(get("/api/products").header("Authorization", "Bearer " + t)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"compras\",\"password\":\"" + PASSWORD + "\"}"))
           .andExpect(status().isUnauthorized());
    }

    // ---------- Permisos por rol ----------

    @Test
    void everyRoleCanRead() throws Exception {
        for (String user : new String[]{"admin", "produccion", "inventario", "compras", "gerencia"}) {
            String t = token(user);
            for (String url : new String[]{"/api/products", "/api/inventory", "/api/inventory/movements", "/api/formulas",
                    "/api/batches", "/api/purchases", "/api/dispatches", "/api/waste", "/api/suppliers", "/api/alerts",
                    "/api/catalogs", "/api/settings"}) {
                mvc.perform(get(url).header("Authorization", "Bearer " + t)).andExpect(status().isOk());
            }
        }
    }

    @Test
    void gerenciaIsReadOnly() throws Exception {
        mvc.perform(as("gerencia", post("/api/products")).content(newProduct("PT-X1")))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.message").value("No tiene permisos para esta acción."));
        mvc.perform(as("gerencia", post("/api/inventory/movements"))
                        .content(adjust(productId("MP-ARE"), "AJUSTE_POS", "1")))
           .andExpect(status().isForbidden());
        mvc.perform(as("gerencia", post("/api/suppliers")).content("{\"nit\":\"1\",\"name\":\"X\"}"))
           .andExpect(status().isForbidden());
    }

    @Test
    void onlyAdminManagesUsers() throws Exception {
        mvc.perform(as("inventario", get("/api/users"))).andExpect(status().isForbidden());
        mvc.perform(as("admin", get("/api/users"))).andExpect(status().isOk())
           .andExpect(jsonPath("$.data.length()").value(5));
        mvc.perform(as("admin", post("/api/users")).content("""
                {"username":"carlos","fullName":"Carlos Pérez","role":"PRODUCCION","password":"Clave2026!"}"""))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.data.role").value("PRODUCCION"));
        String hash = q("SELECT password_hash FROM users WHERE username = 'carlos'", String.class);
        assertThat(hash).startsWith("$2").doesNotContain("Clave2026!");
    }

    @Test
    void userWithoutValidRoleIsRejected() throws Exception {
        mvc.perform(as("admin", post("/api/users")).content("""
                {"username":"sinrol","fullName":"Sin Rol","role":"JEFE","password":"Clave2026!"}"""))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("El rol JEFE no existe."));
    }

    @Test
    void comprasManagesSuppliersButNotProducts() throws Exception {
        mvc.perform(as("compras", post("/api/suppliers")).content("""
                {"nit":"900123456","name":"Cementos Nuevos S.A.S.","city":"Villavicencio"}"""))
           .andExpect(status().isCreated());
        mvc.perform(as("compras", post("/api/products")).content(newProduct("PT-X2"))).andExpect(status().isForbidden());
    }

    // ---------- Fase 3: productos ----------

    @Test
    void createEditAndDeleteProduct() throws Exception {
        String body = mvc.perform(as("inventario", post("/api/products")).content(newProduct("pt-nuevo")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value("PT-NUEVO"))
                .andExpect(jsonPath("$.data.stock").value(10))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).at("/data/id").asLong();
        // Stock inicial queda en el kardex
        assertThat(q("SELECT count(*) FROM inventory_movements WHERE product_id = ? AND movement_type = 'INICIAL'",
                Integer.class, id)).isEqualTo(1);

        mvc.perform(as("inventario", put("/api/products/" + id)).content("""
                {"code":"PT-NUEVO","name":"Pegante renombrado","category":"PRODUCTO_TERMINADO","unit":"BOLSA","minStock":5}"""))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.name").value("Pegante renombrado"));

        // Tiene historial: se desactiva en vez de borrarse
        mvc.perform(as("inventario", delete("/api/products/" + id))).andExpect(status().isOk());
        assertThat(q("SELECT active FROM products WHERE id = ?", Boolean.class, id)).isFalse();
        assertThat(q("SELECT count(*) FROM audit_log WHERE entity = 'product' AND entity_id = ?",
                Integer.class, id)).isEqualTo(3);
    }

    @Test
    void productWithoutHistoryIsReallyDeleted() throws Exception {
        String body = mvc.perform(as("admin", post("/api/products")).content("""
                {"code":"IN-TMP","name":"Temporal","category":"INSUMO","unit":"UND","minStock":3}"""))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).at("/data/id").asLong();
        mvc.perform(as("admin", delete("/api/products/" + id))).andExpect(status().isOk())
           .andExpect(jsonPath("$.message").value("Producto eliminado."));
        assertThat(q("SELECT count(*) FROM products WHERE id = ?", Integer.class, id)).isZero();
    }

    @Test
    void productValidations() throws Exception {
        mvc.perform(as("admin", post("/api/products")).content(newProduct("MP-CEM")))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.message").value("Ya existe un producto con el código MP-CEM."));
        mvc.perform(as("admin", post("/api/products")).content("""
                {"code":"X-1","name":"Sin unidad","category":"INSUMO","unit":"","minStock":1}"""))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("La unidad de medida es obligatoria."));
        mvc.perform(as("admin", post("/api/products")).content("""
                {"code":"X-2","name":"Negativo","category":"INSUMO","unit":"UND","minStock":-1}"""))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("El stock mínimo no puede ser negativo."));
    }

    @Test
    void productListFiltersByCategory() throws Exception {
        mvc.perform(as("gerencia", get("/api/products?category=PRODUCTO_TERMINADO")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.length()").value(2))
           .andExpect(jsonPath("$.data[0].category").value("PRODUCTO_TERMINADO"));
    }

    // ---------- Fase 3: inventario / kardex ----------

    @Test
    void adjustmentUpdatesStockAndKardex() throws Exception {
        BigDecimal before = stock("MP-QUI");
        mvc.perform(as("inventario", post("/api/inventory/movements"))
                        .content(adjust(productId("MP-QUI"), "AJUSTE_POS", "4.5")))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.data.stockBefore").value(before.doubleValue()))
           .andExpect(jsonPath("$.data.stockAfter").value(before.add(new BigDecimal("4.5")).doubleValue()))
           .andExpect(jsonPath("$.data.user").value("Auxiliar de Inventario DEMO"));
        assertThat(stock("MP-QUI")).isEqualByComparingTo(before.add(new BigDecimal("4.5")));
        assertThat(q("SELECT count(*) FROM audit_log WHERE action = 'AJUSTE_INVENTARIO'", Integer.class)).isEqualTo(1);
    }

    @Test
    void insufficientStockIsRejectedWithClearMessage() throws Exception {
        BigDecimal before = stock("MP-CEM");
        mvc.perform(as("inventario", post("/api/inventory/movements"))
                        .content(adjust(productId("MP-CEM"), "AJUSTE_NEG", before.add(BigDecimal.ONE).toPlainString())))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.success").value(false))
           .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("No hay suficiente cemento gris uso general")));
        assertThat(stock("MP-CEM")).isEqualByComparingTo(before);
    }

    @Test
    void manualMovementOnlyAllowsAdjustments() throws Exception {
        mvc.perform(as("inventario", post("/api/inventory/movements"))
                        .content(adjust(productId("MP-ARE"), "PRODUCCION", "1")))
           .andExpect(status().isBadRequest());
        mvc.perform(as("inventario", post("/api/inventory/movements"))
                        .content(adjust(productId("MP-ARE"), "AJUSTE_POS", "0")))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("La cantidad debe ser mayor que cero."));
    }

    @Test
    void stockAlertIsCreatedAndClosedAutomatically() throws Exception {
        long id = productId("MP-ARE");
        BigDecimal s = stock("MP-ARE");
        BigDecimal min = q("SELECT min_stock FROM products WHERE id = ?", BigDecimal.class, id);
        u("UPDATE alerts SET resolved = TRUE WHERE product_id = ?", id);
        // Bajar hasta 1 por debajo del mínimo -> alerta de stock crítico
        BigDecimal down = s.subtract(min).add(BigDecimal.ONE);
        mvc.perform(as("inventario", post("/api/inventory/movements")).content(adjust(id, "AJUSTE_NEG", down.toPlainString())))
           .andExpect(status().isCreated());
        assertThat(q("SELECT count(*) FROM alerts WHERE product_id = ? AND NOT resolved AND alert_type = 'STOCK_CRITICO'",
                Integer.class, id)).isEqualTo(1);
        // Reponer -> la alerta se cierra sola
        mvc.perform(as("inventario", post("/api/inventory/movements")).content(adjust(id, "AJUSTE_POS", "10")))
           .andExpect(status().isCreated());
        assertThat(q("SELECT count(*) FROM alerts WHERE product_id = ? AND NOT resolved", Integer.class, id)).isZero();
    }

    @Test
    void kardexStillBalancesAfterApiMovements() throws Exception {
        mvc.perform(as("admin", post("/api/inventory/movements")).content(adjust(productId("IN-BOL"), "AJUSTE_NEG", "7")))
           .andExpect(status().isCreated());
        Integer mismatches = q("""
            SELECT count(*) FROM products p WHERE p.stock <> COALESCE((
              SELECT sum(CASE WHEN m.movement_type IN ('ENTRADA_COMPRA','PRODUCCION','AJUSTE_POS','INICIAL')
                              THEN m.quantity ELSE -m.quantity END)
              FROM inventory_movements m WHERE m.product_id = p.id), 0)""", Integer.class);
        assertThat(mismatches).isZero();
    }

    @Test
    void kardexFiltersByProductAndType() throws Exception {
        long id = productId("PT-PEG");
        mvc.perform(as("gerencia", get("/api/inventory/movements?productId=" + id + "&type=PRODUCCION&size=5")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.content.length()").value(5))
           .andExpect(jsonPath("$.data.content[0].type").value("PRODUCCION"))
           .andExpect(jsonPath("$.data.content[0].productCode").value("PT-PEG"));
    }

    // ---------- Fase 3: consultas ----------

    @Test
    void batchesIncludeConsumptionsAndVariation() throws Exception {
        String body = mvc.perform(as("produccion", get("/api/batches?size=3")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(3))
                .andReturn().getResponse().getContentAsString();
        JsonNode first = json.readTree(body).at("/data/content/0");
        assertThat(first.get("consumptions").size()).isEqualTo(4);
        assertThat(first.at("/consumptions/0/variationPct").isNumber()).isTrue();
        mvc.perform(as("produccion", get("/api/batches/" + first.get("id").asLong())))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.consumptions.length()").value(4));
    }

    @Test
    void formulaHasItsIngredients() throws Exception {
        mvc.perform(as("produccion", get("/api/formulas")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.length()").value(1))
           .andExpect(jsonPath("$.data[0].items.length()").value(4))
           .andExpect(jsonPath("$.data[0].minBags").value(45))
           .andExpect(jsonPath("$.data[0].maxBags").value(47));
    }

    @Test
    void resolvingAlertIsAudited() throws Exception {
        long id = q("SELECT min(id) FROM alerts WHERE NOT resolved", Long.class);
        mvc.perform(as("produccion", patch("/api/alerts/" + id + "/resolve")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.resolved").value(true));
        mvc.perform(as("gerencia", patch("/api/alerts/" + id + "/resolve"))).andExpect(status().isForbidden());
        mvc.perform(as("admin", get("/api/audit")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.content[?(@.action == 'RESOLVER_ALERTA')].user").value("produccion"));
    }

    @Test
    void notFoundIsClear() throws Exception {
        mvc.perform(as("admin", get("/api/products/999999")))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.message").value("El producto no existe."));
    }

    // ---------- Fase 10: registro de cochadas ----------

    long formulaId() { return q("SELECT id FROM formulas ORDER BY id LIMIT 1", Long.class); }

    String batch(String bags, String cem, String are, String qui, String bol) {
        return "{\"formulaId\":" + formulaId() + ",\"bagsProduced\":" + bags + ",\"notes\":\"Turno mañana\",\"consumptions\":["
                + "{\"productId\":" + productId("MP-CEM") + ",\"realQty\":" + cem + "},"
                + "{\"productId\":" + productId("MP-ARE") + ",\"realQty\":" + are + "},"
                + "{\"productId\":" + productId("MP-QUI") + ",\"realQty\":" + qui + "},"
                + "{\"productId\":" + productId("IN-BOL") + ",\"realQty\":" + bol + "}]}";
    }

    @Test
    void registerBatchMovesInventoryAndKardex() throws Exception {
        BigDecimal cem = stock("MP-CEM"), bol = stock("IN-BOL"), pt = stock("PT-PEG");
        String body = mvc.perform(as("produccion", post("/api/batches")).content(batch("46", "3", "0.51", "1.8", "46")))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.message").value("Cochada registrada."))
           .andExpect(jsonPath("$.data.code").value(org.hamcrest.Matchers.matchesPattern("C-\\d{4}-0001")))
           .andExpect(jsonPath("$.data.inRange").value(true))
           .andExpect(jsonPath("$.data.operator").value("Jefe de Producción DEMO"))
           .andExpect(jsonPath("$.data.consumptions.length()").value(4))
           .andExpect(jsonPath("$.data.consumptions[3].variationPct").value(-2.13))
           .andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).at("/data/id").asLong();
        assertThat(stock("MP-CEM")).isEqualByComparingTo(cem.subtract(new BigDecimal("3")));
        assertThat(stock("IN-BOL")).isEqualByComparingTo(bol.subtract(new BigDecimal("46")));
        assertThat(stock("PT-PEG")).isEqualByComparingTo(pt.add(new BigDecimal("46")));
        assertThat(q("SELECT count(*) FROM inventory_movements WHERE reference_type = 'COCHADA' AND reference_id = ?",
                Integer.class, id)).isEqualTo(5);
        assertThat(q("SELECT count(*) FROM alerts WHERE batch_id = ?", Integer.class, id)).isZero();
        assertThat(q("SELECT count(*) FROM audit_log WHERE action = 'REGISTRAR_COCHADA' AND entity_id = ?",
                Integer.class, id)).isEqualTo(1);
        // El siguiente código es consecutivo
        mvc.perform(as("admin", post("/api/batches")).content(batch("45", "3", "0.51", "1.8", "45")))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.data.code").value(org.hamcrest.Matchers.endsWith("-0002")));
    }

    @Test
    void batchOutOfRangeCreatesAlerts() throws Exception {
        String body = mvc.perform(as("produccion", post("/api/batches")).content(batch("43", "3.3", "0.51", "1.8", "47")))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.data.inRange").value(false))
           .andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).at("/data/id").asLong();
        assertThat(q("SELECT count(*) FROM alerts WHERE batch_id = ? AND alert_type = 'CONSUMO_FUERA_RANGO'", Integer.class, id)).isEqualTo(1);
        assertThat(q("SELECT message FROM alerts WHERE batch_id = ? AND alert_type = 'CONSUMO_FUERA_RANGO'", String.class, id))
                .contains("Cemento gris uso general 10.00 % sobre la fórmula");
        assertThat(q("SELECT message FROM alerts WHERE batch_id = ? AND alert_type = 'PRODUCCION_BAJA'", String.class, id))
                .endsWith("produjo 43 bolsas (mínimo esperado 45).");
    }

    @Test
    void batchWithoutEnoughStockSavesNothing() throws Exception {
        BigDecimal cem = stock("MP-CEM"), pt = stock("PT-PEG");
        int before = q("SELECT count(*) FROM batches", Integer.class);
        mvc.perform(as("produccion", post("/api/batches"))
                        .content(batch("46", cem.add(BigDecimal.ONE).toPlainString(), "0.51", "1.8", "46")))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("No hay suficiente cemento gris uso general")));
        assertThat(q("SELECT count(*) FROM batches", Integer.class)).isEqualTo(before);
        assertThat(stock("PT-PEG")).isEqualByComparingTo(pt);
        assertThat(stock("MP-CEM")).isEqualByComparingTo(cem);
    }

    @Test
    void batchValidationsAndPermissions() throws Exception {
        mvc.perform(as("inventario", post("/api/batches")).content(batch("46", "3", "0.51", "1.8", "46")))
           .andExpect(status().isForbidden());
        mvc.perform(as("produccion", post("/api/batches")).content(batch("0", "3", "0.51", "1.8", "46")))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("Las bolsas producidas deben ser mayores que cero."));
        String missing = "{\"formulaId\":" + formulaId() + ",\"bagsProduced\":46,\"consumptions\":["
                + "{\"productId\":" + productId("MP-CEM") + ",\"realQty\":3}]}";
        mvc.perform(as("produccion", post("/api/batches")).content(missing))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("Falta el consumo real de arena lavada."));
        String future = batch("46", "3", "0.51", "1.8", "46").replace("\"notes\"", "\"producedAt\":\"2999-01-01T00:00:00Z\",\"notes\"");
        mvc.perform(as("produccion", post("/api/batches")).content(future))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("La fecha de la cochada no puede estar en el futuro."));
    }

    // ---------- Fase 9: fórmulas ----------

    String formula(String name, String min, String exp, String max, String cem) {
        return "{\"productId\":" + productId("PT-PEG") + ",\"name\":\"" + name + "\",\"expectedBags\":" + exp
                + ",\"minBags\":" + min + ",\"maxBags\":" + max + ",\"bagWeightKg\":25,\"items\":["
                + "{\"productId\":" + productId("MP-CEM") + ",\"quantity\":" + cem + "},"
                + "{\"productId\":" + productId("MP-ARE") + ",\"quantity\":0.5},"
                + "{\"productId\":" + productId("MP-QUI") + ",\"quantity\":1.8},"
                + "{\"productId\":" + productId("IN-BOL") + ",\"quantity\":47}]}";
    }

    @Test
    void editingFormulaCreatesNewVersionAndKeepsHistory() throws Exception {
        long oldId = formulaId();
        String body = mvc.perform(as("produccion", post("/api/formulas")).content(formula("Fórmula estándar v2", "44", "46", "48", "3.1")))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.data.version").value(2))
           .andExpect(jsonPath("$.data.active").value(true))
           .andExpect(jsonPath("$.data.items.length()").value(4))
           .andReturn().getResponse().getContentAsString();
        long newId = json.readTree(body).at("/data/id").asLong();
        assertThat(q("SELECT active FROM formulas WHERE id = ?", Boolean.class, oldId)).isFalse();
        assertThat(q("SELECT count(*) FROM batches WHERE formula_id = ?", Integer.class, oldId)).isGreaterThan(0);
        assertThat(q("SELECT count(*) FROM audit_log WHERE action = 'NUEVA_VERSION_FORMULA'", Integer.class)).isEqualTo(1);
        // La cochada nueva usa la versión 2; la anterior ya no se puede usar
        mvc.perform(as("produccion", post("/api/batches")).content(batch("46", "3.1", "0.5", "1.8", "47").replace(
                        "\"formulaId\":" + oldId, "\"formulaId\":" + newId)))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.data.inRange").value(true))
           .andExpect(jsonPath("$.data.consumptions[0].variationPct").value(0));
        mvc.perform(as("produccion", post("/api/batches")).content(batch("46", "3", "0.51", "1.8", "47")))
           .andExpect(status().isBadRequest());
        // Volver a la versión 1
        mvc.perform(as("admin", patch("/api/formulas/" + oldId + "/activate")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data.active").value(true));
        assertThat(q("SELECT active FROM formulas WHERE id = ?", Boolean.class, newId)).isFalse();
    }

    @Test
    void formulaValidationsAndPermissions() throws Exception {
        mvc.perform(as("inventario", post("/api/formulas")).content(formula("X", "44", "46", "48", "3")))
           .andExpect(status().isForbidden());
        mvc.perform(as("produccion", post("/api/formulas")).content(formula("X", "48", "46", "44", "3")))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("El mínimo de bolsas no puede ser mayor que el máximo."));
        mvc.perform(as("produccion", post("/api/formulas")).content(formula("X", "44", "50", "48", "3")))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("Las bolsas esperadas deben estar entre el mínimo y el máximo."));
        mvc.perform(as("produccion", post("/api/formulas")).content(formula("X", "44", "46", "48", "0")))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value("La cantidad de cada material debe ser mayor que cero."));
        String forRaw = formula("X", "44", "46", "48", "3").replace("\"productId\":" + productId("PT-PEG") + ",\"name\"",
                "\"productId\":" + productId("MP-CEM") + ",\"name\"");
        mvc.perform(as("produccion", post("/api/formulas")).content(forRaw))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("Las fórmulas son para productos terminados.")));
        assertThat(q("SELECT count(*) FROM formulas", Integer.class)).isEqualTo(1);
    }

    @Test
    void premiumProductGetsItsFirstFormula() throws Exception {
        String body = formula("Fórmula premium v1", "44", "45", "46", "3.5").replace(
                "\"productId\":" + productId("PT-PEG") + ",\"name\"", "\"productId\":" + productId("PT-PRE") + ",\"name\"");
        mvc.perform(as("admin", post("/api/formulas")).content(body))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.data.version").value(1))
           .andExpect(jsonPath("$.data.productName").value("Pegante para enchape premium 25 kg"));
        assertThat(q("SELECT count(*) FROM formulas WHERE active", Integer.class)).isEqualTo(2);
    }

    @Test
    void toleranceCanBeChangedAndIsUsedForAlerts() throws Exception {
        mvc.perform(as("produccion", put("/api/settings/consumo.tolerancia_pct")).content("{\"value\":\"60\"}"))
           .andExpect(status().isBadRequest());
        mvc.perform(as("gerencia", put("/api/settings/consumo.tolerancia_pct")).content("{\"value\":\"12\"}"))
           .andExpect(status().isForbidden());
        mvc.perform(as("admin", put("/api/settings/consumo.tolerancia_pct")).content("{\"value\":\"12,5\"}"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.data['consumo.tolerancia_pct']").value("12.5"));
        String body = mvc.perform(as("produccion", post("/api/batches")).content(batch("46", "3.3", "0.51", "1.8", "47")))
           .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(body).at("/data/id").asLong();
        assertThat(q("SELECT count(*) FROM alerts WHERE batch_id = ?", Integer.class, id)).isZero();
    }

    static String newProduct(String code) {
        return "{\"code\":\"" + code + "\",\"name\":\"Pegante de prueba\",\"category\":\"PRODUCTO_TERMINADO\","
                + "\"unit\":\"BOLSA\",\"minStock\":5,\"initialStock\":10}";
    }

    static String adjust(long productId, String type, String qty) {
        return "{\"productId\":" + productId + ",\"type\":\"" + type + "\",\"quantity\":" + qty + ",\"notes\":\"Conteo físico\"}";
    }
}
