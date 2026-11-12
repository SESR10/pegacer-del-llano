# PROMPT MAESTRO — SISTEMA WEB PEGACER DEL LLANO

Quiero que desarrolles una aplicación web profesional, moderna, responsive y funcional llamada:

**PEGACER DEL LLANO — Sistema Integral de Control de Producción e Inventario**

## 1. CONTEXTO DEL PROYECTO

PEGACER DEL LLANO es una fábrica dedicada a la fabricación de pegantes para enchapes y productos relacionados con la construcción.

Actualmente la fábrica maneja diferentes materias primas y materiales para fabricar su producto final.

Entre ellos:

* Cemento
* Arena
* Productos químicos
* Bolsas de empaque
* Material de sandblasting
* Otros insumos utilizados durante la fabricación

El producto final principal es un **pegante empacado en bolsas de aproximadamente 25 kg**.

La fábrica necesita digitalizar y automatizar el control de:

* Materias primas
* Inventario
* Producción
* Cochadas
* Consumo de materiales
* Producto terminado
* Compras
* Proveedores
* Desperdicios
* Alertas
* Reportes
* Usuarios
* Historial de movimientos

El sistema debe poder utilizarse desde:

* Computador
* Portátil
* Tablet
* Celular

Por lo tanto, debe ser completamente responsive.

---

# 2. PROBLEMA PRINCIPAL

Actualmente la fábrica necesita controlar cuánto material entra, cuánto se utiliza en cada fabricación y cuánto producto terminado se obtiene.

La unidad principal de fabricación será denominada:

**COCHADA**

Una cochada es el proceso mediante el cual se mezclan las materias primas en la máquina mezcladora para producir el pegante.

Como referencia inicial:

Una cochada utiliza aproximadamente:

* 3 bultos de cemento
* 0,51 m³ de arena
* 1,8 kg de químicos

Y produce aproximadamente:

* 45 a 47 bolsas
* Cada bolsa de aproximadamente 25 kg

IMPORTANTE:

Estos valores son configurables y NO deben quedar escritos directamente en el código.

El administrador debe poder modificar las fórmulas desde el sistema.

---

# 3. OBJETIVO DEL SISTEMA

El objetivo es crear una plataforma web que permita controlar automáticamente el flujo:

MATERIA PRIMA
↓
INVENTARIO
↓
RECETA / FÓRMULA
↓
COCHADA
↓
CONSUMO REAL
↓
PRODUCCIÓN
↓
PRODUCTO TERMINADO
↓
VENTAS / SALIDAS
↓
REPORTES

Cada operación debe actualizar automáticamente los inventarios correspondientes.

---

# 4. TECNOLOGÍA

Construye el proyecto utilizando una arquitectura profesional.

Preferiblemente:

Frontend:

* React
* Vite
* JavaScript o TypeScript
* CSS moderno
* Diseño responsive

Backend:

* Java 21
* Spring Boot
* Spring Web
* Spring Data JPA
* Spring Security
* JWT

Base de datos:

* PostgreSQL

Documentación:

* Swagger / OpenAPI

La aplicación debe estar preparada para ejecutarse localmente y posteriormente desplegarse en internet.

Si consideras que alguna tecnología debe cambiarse por una alternativa más apropiada, justifica la decisión antes de implementarla.

---

# 5. DISEÑO VISUAL

Quiero un diseño profesional relacionado con una fábrica industrial.

No quiero una página genérica.

El estilo debe transmitir:

* Industria
* Tecnología
* Control
* Precisión
* Producción
* Seguridad
* Profesionalismo

Utiliza una interfaz moderna tipo SaaS / ERP.

Paleta sugerida:

* Azul oscuro
* Azul industrial
* Blanco
* Gris oscuro
* Gris claro
* Verde para estados correctos
* Amarillo para advertencias
* Rojo para alertas críticas

Usar:

* Sidebar
* Navbar
* Cards
* Tablas
* Gráficas
* Modales
* Badges
* Botones claros
* Iconos
* Estados visuales
* Animaciones sutiles

NO sobrecargues la interfaz.

Debe verse como un software empresarial real.

---

# 6. DASHBOARD PRINCIPAL

El Dashboard debe mostrar inmediatamente el estado de la fábrica.

Crear tarjetas para:

### Materias primas

* Cemento disponible
* Arena disponible
* Químicos disponibles
* Bolsas disponibles

### Producción

* Cochadas realizadas hoy
* Bolsas producidas hoy
* Producción mensual
* Producción acumulada

### Inventario

* Valor aproximado del inventario
* Productos con stock bajo
* Productos agotados

### Alertas

* Stock crítico
* Productos próximos a agotarse
* Consumos anormales
* Producciones fuera del rango esperado

### Indicadores

Mostrar gráficas de:

* Producción por día
* Consumo de materias primas
* Producción mensual
* Entradas vs salidas
* Desperdicios

---

# 7. MENÚ PRINCIPAL

Crear un sidebar con:

Dashboard

Inventario

Producción

Cochadas

Fórmulas

Productos

Materias primas

Compras

Proveedores

Producto terminado

Desperdicios

Reportes

Usuarios

Configuración

Cerrar sesión

---

# 8. MÓDULO DE PRODUCTOS

Crear CRUD completo.

Campos:

* ID
* Nombre
* Código
* Categoría
* Tipo
* Unidad de medida
* Stock mínimo
* Stock máximo
* Stock actual
* Costo
* Estado
* Descripción

Ejemplos:

* Cemento
* Arena
* Químico
* Bolsa 25 kg
* Pegante estándar 25 kg
* Pegante premium 25 kg

Permitir:

* Crear
* Editar
* Eliminar
* Buscar
* Filtrar
* Ver detalles

---

# 9. MÓDULO DE INVENTARIO

Debe manejar inventario en tiempo real.

Cada producto debe tener:

* Stock actual
* Stock mínimo
* Stock máximo
* Unidad de medida
* Entradas
* Salidas
* Ajustes
* Desperdicios
* Historial

IMPORTANTE:

Las unidades pueden ser diferentes:

* Bultos
* Kilogramos
* Metros cúbicos
* Unidades
* Bolsas

Nunca mezclar unidades incorrectamente.

---

# 10. MOVIMIENTOS DE INVENTARIO

Registrar:

* Entrada
* Salida
* Consumo de producción
* Desperdicio
* Ajuste
* Devolución

Cada movimiento debe guardar:

* Fecha
* Hora
* Usuario
* Producto
* Cantidad
* Unidad
* Tipo de movimiento
* Motivo
* Observaciones

Nunca modificar silenciosamente el inventario.

Toda modificación debe generar un movimiento.

---

# 11. MÓDULO DE FÓRMULAS

Este módulo es fundamental.

Permitir crear recetas de fabricación.

Ejemplo:

PRODUCTO:

Pegante estándar 25 kg

FÓRMULA:

Cemento:
3 bultos

Arena:
0,51 m³

Químico:
1,8 kg

Bolsas:
47 unidades aproximadamente

Producción esperada:

45–47 bolsas

La fórmula debe ser editable.

Nunca escribir los valores directamente dentro del código.

---

# 12. MÓDULO DE COCHADAS

Crear una pantalla:

**Nueva Cochada**

El usuario selecciona:

* Producto
* Fórmula
* Fecha
* Responsable

El sistema debe mostrar automáticamente el consumo teórico.

Ejemplo:

Cemento:

Teórico:
3 bultos

El operario introduce:

Real:
3,05 bultos

Arena:

Teórico:
0,51 m³

Real:
0,52 m³

Químico:

Teórico:
1,8 kg

Real:
1,82 kg

Producción:

46 bolsas

---

# 13. CÁLCULO DE VARIACIONES

El sistema debe calcular:

Variación = Consumo real - Consumo teórico

Ejemplo:

Cemento:

3,05 - 3,00 = +0,05

Mostrar:

* Teórico
* Real
* Diferencia
* Porcentaje de variación

Si la diferencia supera un límite configurable:

Mostrar:

⚠️ CONSUMO FUERA DEL RANGO ESPERADO

---

# 14. REGISTRO DE COCHADA

Al confirmar una cochada:

DEBE ocurrir automáticamente:

1. Descontar materias primas.
2. Descontar bolsas utilizadas.
3. Registrar consumo.
4. Registrar producción.
5. Aumentar producto terminado.
6. Guardar variaciones.
7. Guardar usuario responsable.
8. Guardar fecha y hora.
9. Generar historial.
10. Revisar alertas de inventario.

Todo debe realizarse dentro de una transacción de base de datos.

Si ocurre un error, NO debe quedar el inventario parcialmente actualizado.

---

# 15. CAPACIDAD DE PRODUCCIÓN

Crear una función:

**¿Cuántas cochadas puedo fabricar con el inventario actual?**

Ejemplo:

Cemento disponible:

60 bultos

Consumo:

3 bultos/cochada

Resultado:

20 cochadas

Arena disponible:

8 m³

Consumo:

0,51 m³/cochada

Resultado:

15 cochadas

Químico:

40 kg

Consumo:

1,8 kg/cochada

Resultado:

22 cochadas

El sistema debe determinar el recurso limitante.

Resultado:

CAPACIDAD ESTIMADA:

15 cochadas

Mostrar también cuántas bolsas aproximadamente podrían producirse.

---

# 16. PRODUCTO TERMINADO

Crear inventario independiente para producto terminado.

Ejemplo:

Pegante estándar 25 kg:

* Producción acumulada
* Ventas/salidas
* Devoluciones
* Stock actual

Registrar:

+46 bolsas

cuando se cierre una cochada de 46 bolsas.

---

# 17. DESPERDICIOS

Crear módulo para registrar pérdidas.

Ejemplo:

Producto:

Cemento

Cantidad:

0,25 bultos

Motivo:

Derrame

Registrar:

* Producto
* Cantidad
* Unidad
* Motivo
* Fecha
* Usuario
* Observaciones

El desperdicio debe descontarse del inventario.

---

# 18. COMPRAS

Crear módulo de proveedores.

Proveedor:

* Nombre
* NIT
* Teléfono
* Correo
* Dirección
* Contacto
* Estado

Crear órdenes de compra.

Una compra debe poder contener múltiples productos.

Al recibir una compra:

Actualizar inventario automáticamente.

---

# 19. ALERTAS

Crear sistema automático de alertas.

Ejemplos:

🔴 STOCK CRÍTICO

Cemento:
18 bultos

Mínimo:
30

🟡 STOCK BAJO

Químico:
25 kg

🟠 CONSUMO ANORMAL

Cemento:

Teórico:
3

Real:
4,2

🔵 PRODUCCIÓN

46 bolsas producidas.

---

# 20. REPORTES

Crear módulo de reportes.

Reportes:

### Producción

* Producción diaria
* Producción semanal
* Producción mensual
* Producción por producto
* Cochadas

### Inventario

* Inventario actual
* Entradas
* Salidas
* Ajustes
* Desperdicios

### Consumo

* Cemento
* Arena
* Químicos
* Bolsas

### Costos

* Costo por cochada
* Costo por bolsa
* Costo de materias primas

### Rendimiento

* Producción esperada
* Producción real
* Variaciones
* Desperdicio

Permitir exportar reportes a:

* PDF
* Excel
* CSV

---

# 21. COSTO DE PRODUCCIÓN

Preparar el sistema para calcular:

Costo de cemento
+
Costo de arena
+
Costo de químicos
+
Costo de bolsas
+
Otros costos configurables

=

Costo estimado de cochada

Luego:

Costo de cochada / bolsas producidas

=

Costo aproximado por bolsa

No asumir valores de costos si no existen.

Permitir introducirlos desde el sistema.

---

# 22. USUARIOS Y ROLES

Crear autenticación.

Roles:

ADMINISTRADOR

PRODUCCIÓN

INVENTARIO

COMPRAS

GERENCIA

Cada rol debe tener permisos diferentes.

Ejemplo:

Producción:

Puede registrar cochadas.

Inventario:

Puede gestionar movimientos.

Compras:

Puede gestionar proveedores y órdenes.

Gerencia:

Puede consultar información y reportes.

Administrador:

Acceso completo.

---

# 23. SEGURIDAD

Implementar:

* Login
* JWT
* Password hashing
* Roles
* Protección de endpoints
* Validación de datos
* Manejo de errores
* Auditoría

Nunca almacenar contraseñas en texto plano.

---

# 24. AUDITORÍA

Registrar quién realizó cada operación.

Ejemplo:

Usuario:

Carlos

Fecha:

01/10/2026

Acción:

REGISTRO DE COCHADA

Cochada:

#0157

Resultado:

46 bolsas

Esto debe permitir consultar posteriormente qué usuario hizo cada movimiento.

---

# 25. RESPONSIVE

La aplicación debe funcionar correctamente en:

1920px

1440px

1024px

768px

480px

360px

En celular:

* Sidebar adaptable
* Menú hamburguesa
* Cards apiladas
* Tablas con scroll
* Botones táctiles
* Formularios adaptados

---

# 26. EXPERIENCIA DE USUARIO

Quiero que la aplicación sea sencilla para un trabajador de fábrica.

No utilizar términos técnicos innecesarios.

Los botones deben ser claros:

* Nueva cochada

* Entrada de inventario

* Registrar desperdicio

* Nueva compra

* Nuevo producto

Ver inventario

Ver reportes

---

# 27. DATOS DE DEMOSTRACIÓN

Crear datos iniciales para poder presentar el proyecto.

Productos:

Cemento

Arena

Químico

Bolsa 25 kg

Pegante estándar 25 kg

Pegante premium 25 kg

Crear varias cochadas de ejemplo.

Crear movimientos.

Crear alertas.

Crear proveedores.

Crear producción histórica.

IMPORTANTE:

Marcar estos datos como DEMO.

No hacer pasar datos ficticios por datos reales.

---

# 28. ARQUITECTURA DEL PROYECTO

Organizar correctamente:

frontend/

backend/

database/

docs/

README.md

Dentro del backend utilizar:

controller/

service/

repository/

entity/

dto/

config/

security/

exception/

Dentro del frontend:

components/

pages/

layouts/

services/

hooks/

utils/

assets/

styles/

---

# 29. API REST

Crear endpoints organizados.

Ejemplos:

GET /api/products

POST /api/products

PUT /api/products/{id}

DELETE /api/products/{id}

GET /api/inventory

GET /api/inventory/movements

POST /api/inventory/movements

GET /api/recipes

POST /api/recipes

GET /api/batches

POST /api/batches

GET /api/production

GET /api/purchases

POST /api/purchases

GET /api/suppliers

POST /api/suppliers

GET /api/reports

GET /api/alerts

No crear endpoints innecesarios.

---

# 30. BASE DE DATOS

Diseñar una base de datos relacional correctamente normalizada.

Entidades principales:

User

Role

Product

Category

UnitOfMeasure

Inventory

InventoryMovement

Recipe

RecipeItem

ProductionBatch

BatchConsumption

Production

Waste

Supplier

PurchaseOrder

PurchaseOrderItem

Alert

AuditLog

ProductFinished

No duplicar información innecesariamente.

Usar claves primarias y foráneas correctamente.

---

# 31. VALIDACIONES

Implementar validaciones.

No permitir:

* Stock negativo
* Cantidades negativas
* Cochadas sin fórmula
* Productos sin unidad
* Compras sin proveedor
* Producción sin producto
* Usuarios sin rol
* Fórmulas sin ingredientes

Mostrar mensajes de error claros.

---

# 32. MANEJO DE ERRORES

Crear respuestas consistentes.

Ejemplo:

```json
{
  "success": false,
  "message": "No hay suficiente cemento para registrar la cochada."
}
```

Nunca mostrar errores técnicos directamente al usuario.

---

# 33. DISEÑO DEL DASHBOARD

Quiero que visualmente se vea parecido a un software empresarial moderno.

Encabezado:

PEGACER DEL LLANO

Sistema Integral de Producción

Sidebar:

Dashboard
Inventario
Producción
Cochadas
Fórmulas
Compras
Reportes
Usuarios
Configuración

Dashboard:

Resumen general

Inventario

Producción

Alertas

Actividad reciente

Gráficas

---

# 34. REGLA MUY IMPORTANTE

NO quiero solamente una maqueta visual.

Quiero que desarrolles una aplicación funcional.

Los botones deben funcionar.

Los formularios deben funcionar.

Los datos deben guardarse.

Los cálculos deben funcionar.

Los filtros deben funcionar.

El inventario debe actualizarse.

Las cochadas deben afectar el inventario.

Las alertas deben calcularse.

Los reportes deben obtener información real de la base de datos.

---

# 35. DESARROLLO POR ETAPAS

NO intentes construir todo de forma desordenada.

Trabaja en este orden:

FASE 1:

Configurar proyecto.

FASE 2:

Base de datos.

FASE 3:

Backend.

FASE 4:

Autenticación.

FASE 5:

Frontend.

FASE 6:

Dashboard.

FASE 7:

Productos.

FASE 8:

Inventario.

FASE 9:

Fórmulas.

FASE 10:

Cochadas.

FASE 11:

Producción.

FASE 12:

Compras.

FASE 13:

Alertas.

FASE 14:

Reportes.

FASE 15:

Responsive.

FASE 16:

Pruebas.

---

# 36. PRUEBAS

Antes de considerar terminado cada módulo:

Crear pruebas.

Probar:

Crear producto.

Editar producto.

Eliminar producto.

Registrar entrada.

Registrar salida.

Crear fórmula.

Crear cochada.

Verificar consumo.

Verificar inventario.

Verificar producción.

Verificar alertas.

Verificar permisos.

Verificar errores.

Probar diferentes cantidades.

Probar inventario insuficiente.

Probar producción fuera del rango.

---

# 37. NO HACER SUPOSICIONES

Cuando falte información real de la fábrica:

NO inventes procesos.

NO inventes costos.

NO inventes proveedores.

NO inventes fórmulas adicionales.

Utiliza datos DEMO claramente identificados.

Deja configurables los valores que posteriormente deberá proporcionar la empresa.

---

# 38. README

Crear un README completo explicando:

* Requisitos
* Instalación
* Configuración
* Base de datos
* Variables de entorno
* Ejecución backend
* Ejecución frontend
* Usuario demo
* Contraseña demo
* Endpoints
* Arquitectura
* Pruebas

---

# 39. PRESENTACIÓN DEL PROYECTO

La aplicación debe verse suficientemente profesional para presentarla académicamente y mostrar cómo podría utilizarse en una fábrica real.

Debe tener:

* Dashboard atractivo
* Datos demo
* Navegación completa
* Formularios funcionales
* Tablas
* Gráficas
* Alertas
* Producción
* Inventario
* Cochadas

---

# 40. REGLA FINAL DE DESARROLLO

Antes de modificar archivos:

1. Analiza la estructura actual.
2. No elimines funcionalidades que ya funcionan.
3. Reutiliza componentes.
4. Evita código duplicado.
5. Mantén nombres claros.
6. Comenta solamente cuando sea necesario.
7. Mantén la arquitectura organizada.
8. Ejecuta las pruebas después de cada módulo.
9. Corrige los errores antes de continuar.
10. No declares una funcionalidad terminada si no fue probada.

Si detectas un problema arquitectónico, explícalo y corrígelo.

Si una decisión técnica tiene varias alternativas, utiliza la que sea más sencilla de mantener y explícala brevemente.

COMIENZA AHORA.

Primero analiza el proyecto actual y su estructura.

Después crea o corrige la arquitectura necesaria.

Luego implementa la FASE 1.

No te limites a explicarme qué código debería escribir.

QUIERO QUE ESCRIBAS Y MODIFIQUES EL CÓDIGO DEL PROYECTO.

Al terminar cada etapa:

* Indica qué archivos modificaste.
* Indica qué funcionalidades quedaron funcionando.
* Indica cómo probarlas.
* Ejecuta las pruebas disponibles.
* Corrige los errores encontrados antes de continuar.
