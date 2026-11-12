package co.pegacer.sistema;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Requiere PostgreSQL con la base pegacer_test (ver README). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"demo", "test"})
class SistemaApplicationTests {

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.database").value("UP"));
    }

    @Test
    void protectedEndpointsAnswerWithClearMessage() throws Exception {
        mvc.perform(get("/api/products")).andExpect(status().isUnauthorized())
           .andExpect(jsonPath("$.success").value(false))
           .andExpect(jsonPath("$.message").value("Debe iniciar sesión para continuar."));
    }

    @Test
    void swaggerIsAvailable() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
    }

    @Test
    void baseDataExists() {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM roles", Integer.class)).isEqualTo(5);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM product_categories", Integer.class)).isEqualTo(3);
    }

    @Test
    void stockEqualsSumOfMovements() {
        Integer mismatches = jdbc.queryForObject("""
            SELECT count(*) FROM products p WHERE p.stock <> COALESCE((
              SELECT sum(CASE WHEN m.movement_type IN ('ENTRADA_COMPRA','PRODUCCION','AJUSTE_POS','INICIAL')
                              THEN m.quantity ELSE -m.quantity END)
              FROM inventory_movements m WHERE m.product_id = p.id), 0)""", Integer.class);
        assertThat(mismatches).isZero();
    }

    @Test
    void variationIsCalculatedByDatabase() {
        Integer wrong = jdbc.queryForObject("""
            SELECT count(*) FROM batch_consumptions
            WHERE variation_pct <> round((real_qty - theoretical_qty) * 100 / theoretical_qty, 2)""", Integer.class);
        Integer total = jdbc.queryForObject("SELECT count(*) FROM batch_consumptions", Integer.class);
        assertThat(total).isPositive();
        assertThat(wrong).isZero();
    }

    @Test
    void negativeStockIsRejected() {
        assertThatThrownBy(() -> jdbc.update("UPDATE products SET stock = -1 WHERE code = 'MP-CEM'"))
            .hasMessageContaining("check");
    }

    @Test
    void formulaWithZeroQuantityIsRejected() {
        assertThatThrownBy(() -> jdbc.update(
            "UPDATE formula_items SET quantity = 0 WHERE id = (SELECT min(id) FROM formula_items)"))
            .hasMessageContaining("check");
    }
}
