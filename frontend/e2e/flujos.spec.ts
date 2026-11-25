import { expect, test, type Page } from '@playwright/test';

/** Flujos principales del prompt maestro (sección 36), en la demostración sin servidor. */

async function go(page: Page, path: string) {
  await page.goto(`./#${path}`);
  await expect(page.locator('.page-head h1, .page-head h2').first()).toBeVisible();
}
const toast = (page: Page) => page.locator('.toast');

test('el inicio muestra indicadores y la navegación funciona', async ({ page }) => {
  await go(page, '/');
  await expect(page.locator('.kpi').first()).toBeVisible();
  for (const [link, title] of [['Cochadas', 'Cochadas'], ['Inventario', 'Inventario'], ['Reportes', 'Reportes'], ['Configuración', 'Configuración']]) {
    await page.locator('.nav').getByRole('link', { name: link, exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
  }
});

test('crear, editar y eliminar un producto', async ({ page }) => {
  await go(page, '/productos');
  await page.locator('.page-actions .btn-primary').click();
  const f = page.locator('#product-form');
  await f.locator('input').nth(0).fill('mp-cal');
  await f.locator('input').nth(1).fill('Cal hidratada');
  await f.locator('select').nth(1).selectOption('BULTO');
  await f.locator('input').nth(2).fill('20');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(toast(page)).toContainText('Cal hidratada');
  await expect(page.getByRole('cell', { name: 'Cal hidratada' }).first()).toBeVisible();

  // código repetido
  await page.locator('.page-actions .btn-primary').click();
  await f.locator('input').nth(0).fill('MP-CAL');
  await f.locator('input').nth(1).fill('Otra');
  await f.locator('input').nth(2).fill('1');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(page.locator('.form-error')).toContainText('Ya existe un producto con el código MP-CAL');
  await page.locator('.modal-foot').getByText('Cancelar').click();

  await page.getByRole('button', { name: 'Editar Cal hidratada' }).click();
  await f.locator('input').nth(2).fill('40');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(toast(page)).toBeVisible();

  await page.getByRole('button', { name: 'Editar Cal hidratada' }).click();
  await page.locator('.modal-foot').getByText('Eliminar').click();
  await page.locator('.modal-foot .btn-danger').click();
  await expect(page.getByRole('cell', { name: 'Cal hidratada' })).toHaveCount(0);
});

test('entrada por compra suma al inventario', async ({ page }) => {
  await go(page, '/compras');
  await page.getByRole('button', { name: 'Registrar compra' }).click();
  await page.locator('#purchase-form input').first().fill('FV-E2E-1');
  await page.locator('#purchase-form .line-item select').selectOption({ label: 'Arena lavada' });
  await page.locator('#purchase-form .line-item .material-input input').first().fill('10');
  await expect(page.locator('.line-hint').first()).toContainText('quedará en');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(toast(page)).toContainText('Compra OC-');
  // misma factura del mismo proveedor: rechazada
  const supplier = await page.locator('table tbody tr').first().locator('td').nth(3).textContent();
  await page.getByRole('button', { name: 'Registrar compra' }).click();
  await page.locator('#purchase-form select').first().selectOption({ label: supplier!.trim() });
  await page.locator('#purchase-form input').first().fill('FV-E2E-1');
  await page.locator('#purchase-form .line-item .material-input input').first().fill('1');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(page.locator('.form-error')).toContainText('Ya se registró la factura FV-E2E-1');
});

test('salida por despacho y despacho sin bolsas suficientes', async ({ page }) => {
  await go(page, '/producto-terminado');
  await page.getByRole('button', { name: 'Registrar despacho' }).click();
  await page.locator('#dispatch-form input').first().fill('Ferretería El Llano');
  await page.locator('#dispatch-form .material-input input').fill('999999');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(page.locator('.form-error')).toContainText('No hay suficiente');
  await page.locator('#dispatch-form .material-input input').fill('20');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(toast(page)).toContainText('20 bolsas para Ferretería El Llano');
});

test('ajuste de inventario con motivo obligatorio', async ({ page }) => {
  await go(page, '/inventario');
  await page.locator('.page-actions .btn-primary').click();
  await page.locator('.segmented').getByText('Restar').click();
  await page.locator('#adjust-form input').fill('1');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(page.locator('.form-error')).toContainText('motivo');
  await page.locator('.quick-reasons').getByText('Conteo físico').click();
  await page.locator('.modal-foot .btn-primary').click();
  await expect(toast(page)).toContainText('Ajuste registrado');
});

test('editar una fórmula crea una versión nueva', async ({ page }) => {
  await go(page, '/formulas');
  await page.locator('.card-head').getByText('Editar').first().click();
  await page.locator('#formula-form .material-input input').first().fill('3.1');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(toast(page)).toBeVisible();
  await expect(page.getByText(/Activa · v2/)).toBeVisible();
});

test('registrar cochada: consumo y producción fuera de rango', async ({ page }) => {
  await go(page, '/cochadas');
  const before = await page.locator('table tbody tr').count();
  await page.locator('.page-actions .btn-primary').click();
  await page.getByLabel('Bolsas producidas').fill('40');
  await page.getByText('Igual a la fórmula').click();
  const first = page.locator('.material-input input').first();
  await first.fill('3.6'); // ~20 % sobre la fórmula
  await page.locator('.modal-foot .btn-primary').click();
  await expect(toast(page)).toContainText('C-');
  expect(await page.locator('table tbody tr').count()).toBeGreaterThanOrEqual(before);
});

test('cochada sin materia prima suficiente no se guarda', async ({ page }) => {
  await go(page, '/cochadas');
  await page.locator('.page-actions .btn-primary').click();
  await page.getByLabel('Bolsas producidas').fill('45');
  await page.getByText('Igual a la fórmula').click();
  await page.locator('.material-input input').first().fill('99999');
  await page.locator('.modal-foot .btn-primary').click();
  await expect(page.locator('.form-error')).toContainText('No hay suficiente');
});

test('atender alertas y verlas en el historial', async ({ page }) => {
  await go(page, '/alertas');
  const n = await page.locator('.alert-li').count();
  expect(n).toBeGreaterThan(0);
  await page.locator('.alert-li .btn').first().click();
  await expect(toast(page)).toContainText('atendida');
  await expect(page.locator('.alert-li')).toHaveCount(n - 1);
  await page.locator('.segmented').getByText('Atendidas').click();
  await expect(page.locator('.alert-li.done')).toHaveCount(1);
});

test('reportes: se calculan y se descargan en CSV y Excel', async ({ page }) => {
  await go(page, '/reportes');
  await expect(page.locator('.report-table').first()).toBeVisible();
  for (const k of ['Consumo', 'Costos', 'Inventario', 'Rendimiento']) {
    await page.locator('.report-kinds').getByText(k, { exact: true }).click();
    await expect(page.locator('.report-table').first()).toBeVisible();
  }
  const [csv] = await Promise.all([page.waitForEvent('download'), page.locator('.export-actions').getByText('CSV').click()]);
  expect(csv.suggestedFilename()).toMatch(/^rendimiento_.*\.csv$/);
  const [xlsx] = await Promise.all([page.waitForEvent('download'), page.locator('.export-actions').getByText('Excel').click()]);
  expect(xlsx.suggestedFilename()).toMatch(/\.xlsx$/);
});

test('una dirección que no existe muestra página no encontrada', async ({ page }) => {
  await page.goto('./#/no-existe');
  await expect(page.getByText('Página no encontrada')).toBeVisible();
});
