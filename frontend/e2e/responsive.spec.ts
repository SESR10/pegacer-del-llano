import { expect, test } from '@playwright/test';

/** En el celular ninguna pantalla debe desbordarse a lo ancho. */
const ROUTES = ['/', '/cochadas', '/produccion', '/formulas', '/inventario', '/producto-terminado', '/desperdicios', '/productos',
  '/materias-primas', '/compras', '/proveedores', '/alertas', '/reportes', '/usuarios', '/configuracion'];

for (const r of ROUTES) {
  test(`sin desborde horizontal en ${r}`, async ({ page }) => {
    await page.goto(`./#${r}`);
    await expect(page.locator('.page-head').first()).toBeVisible();
    await page.waitForTimeout(300);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
}

test('el menú inferior y el menú completo funcionan en el celular', async ({ page }) => {
  await page.goto('./#/');
  await page.locator('.tabbar').getByRole('link', { name: 'Cochadas' }).click();
  await expect(page.getByRole('heading', { name: 'Cochadas', exact: true }).first()).toBeVisible();
  await page.locator('.tabbar button').click();
  await expect(page.locator('.sidebar')).toBeVisible();
});
