# Plan de pruebas (Fase 16)

Las pruebas corren solas en GitHub en cada PR y en cada cambio de `main` (`.github/workflows/pruebas.yml`).

| Capa | Qué prueba | Cómo se ejecuta | Cantidad |
|---|---|---|---|
| Backend | Reglas de negocio, permisos por rol, kardex, alertas, reportes, contra PostgreSQL real | `cd backend && mvn test` (necesita la base `pegacer_test`) | 50 |
| Frontend | Pantallas y flujos completos en el navegador, en escritorio y en celular | `cd frontend && npm run test:e2e` (usa la demostración, no necesita servidor) | 27 |

## Lista de la sección 36 del prompt maestro

| Qué pide probar | Backend (`ApiIntegrationTests`, `SistemaApplicationTests`) | Navegador (`frontend/e2e`) |
|---|---|---|
| Crear producto | `createEditAndDeleteProduct`, `productValidations` | crear, editar y eliminar un producto |
| Editar producto | `createEditAndDeleteProduct` | ídem |
| Eliminar producto | `createEditAndDeleteProduct`, `productWithoutHistoryIsReallyDeleted` | ídem |
| Registrar entrada | `purchaseAddsStockAndUpdatesCost`, `adjustmentUpdatesStockAndKardex` | entrada por compra suma al inventario; ajuste de inventario |
| Registrar salida | `dispatchDiscountsFinishedGoods`, `wasteDiscountsInventoryAndKeepsReason` | salida por despacho |
| Crear fórmula | `editingFormulaCreatesNewVersionAndKeepsHistory`, `premiumProductGetsItsFirstFormula`, `formulaValidationsAndPermissions` | editar una fórmula crea una versión nueva |
| Crear cochada | `registerBatchMovesInventoryAndKardex`, `batchValidationsAndPermissions` | registrar cochada |
| Verificar consumo | `batchesIncludeConsumptionsAndVariation`, `variationIsCalculatedByDatabase` | registrar cochada (consumo fuera de la fórmula) |
| Verificar inventario | `stockEqualsSumOfMovements`, `kardexStillBalancesAfterApiMovements`, `inventoryReportBalancesOpeningMovementsAndClosing` | reportes |
| Verificar producción | `capacityFindsLimitingMaterial`, `registerBatchMovesInventoryAndKardex` | inicio y reportes |
| Verificar alertas | `stockAlertIsCreatedAndClosedAutomatically`, `batchOutOfRangeCreatesAlerts`, `alertsRecordWhoResolvedThemAndCanBeResolvedTogether` | atender alertas y verlas en el historial |
| Verificar permisos | `everyRoleCanRead`, `gerenciaIsReadOnly`, `onlyAdminManagesUsers`, `comprasManagesSuppliersButNotProducts` y los `...Permissions` | (los permisos se prueban en el backend) |
| Verificar errores | `notFoundIsClear`, `protectedEndpointsAnswerWithClearMessage`, `wrongPasswordAndUnknownUserGiveSameMessage`, `productValidations` | código repetido, factura repetida, motivo obligatorio, página no encontrada |
| Probar diferentes cantidades | `toleranceCanBeChangedAndIsUsedForAlerts`, `formulaWithZeroQuantityIsRejected` | cantidades en compras, despachos y cochadas |
| Inventario insuficiente | `insufficientStockIsRejectedWithClearMessage`, `batchWithoutEnoughStockSavesNothing`, `negativeStockIsRejected` | despacho sin bolsas suficientes; cochada sin materia prima suficiente |
| Producción fuera del rango | `batchOutOfRangeCreatesAlerts` | registrar cochada fuera de rango |

Además, `responsive.spec.ts` revisa en un iPhone 13 que ninguna de las 15 pantallas se desborde a lo ancho y que funcionen la barra inferior y el menú completo.

## Antes de usarlo con datos reales

- Cambiar las contraseñas de los usuarios DEMO (o desactivarlos) y crear los usuarios reales en **Usuarios**.
- Escribir el costo unitario de cada materia prima (Productos o en cada compra) para que el reporte de costos sea completo.
- Activar copias de seguridad de PostgreSQL en Railway.
- Desplegar con el perfil de producción (sin datos DEMO).
