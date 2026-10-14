# Gestión de ingresos y gastos

Repositorio: `sofiigentaa/Gestion-de-Ingresos-y-Gastos-para-Emprendedor`. React + Vite. Sin Express en el código de `src`, aunque `express` está en `package.json` sin uso. Moneda mostrada: `$` fijo.

## Actores y persistencia

| Modo | Login | Datos |
| --- | --- | --- |
| Sin Supabase | No | `localStorage`: `artisan_finance_transactions_v2` y `artisan_finance_categories_v2`. Si no hay movimientos, carga 12 de ejemplo. |
| Con Supabase | Email y contraseña. Signup público debe estar apagado según `DEPLOY.md`. | Tablas con RLS `user_id = auth.uid()`. |

No hay roles. Cada usuario de Supabase ve solo lo suyo. No hay “contador” vs “dueño”.

Categorías de código: egresos `compra_insumos`, `corte_laser`, `nafta`, `canon_feria`; ingresos `venta_feria`, `pedido_personalizado`. No hay pantalla para crear categorías. El reset las vuelve a ese catálogo.

## IG-M01 Acceso

### IG-HU-01 Entrar a la nube

Como emprendedor, quiero entrar con mi usuario, para ver solo mis movimientos.

Casos: `IG-TC-001`, `IG-TC-002`.

## IG-M02 Dashboard

Filtro de mes: `date` empieza con `YYYY-MM`.

```text
ingresos = suma de type ingreso
egresos = suma de type egreso
balance = ingresos - egresos
margen = ingresos > 0 ? (balance / ingresos) * 100 : 0
```

El balance **puede ser negativo**. No usa el piso en cero de la agenda odontológica.

KPIs compuestos: insumos = `compra_insumos`, `corte_laser` o id que empiece con `insumos_`. Ferias = `canon_feria`, `nafta` o `nafta_movilidad`. Esas dos últimas claves extra no están en el catálogo actual.

El registro rápido usa la fecha de hoy, no el mes que se está mirando en el encabezado. Requiere validación.

El enlace “ver todos los registros del mes” abre la vista del día de hoy, no el historial filtrado (IG-BUG-004, potencial).

### IG-HU-02 Ver el mes

Como emprendedor, quiero ver ingresos, egresos y balance del mes elegido, para saber si cerré en positivo.

```gherkin
Escenario: un ingreso y un egreso en el mes
  Dado un ingreso de 10000 y un egreso de 4000 con fecha de ese mes
  Entonces el balance del dashboard es 6000
  Y el margen es 60.0

Escenario: movimiento de otro mes
  Dado un ingreso con fecha del mes anterior
  Cuando miro el mes actual
  Entonces ese ingreso no suma
```

Casos: `IG-TC-003`, `IG-TC-004`, `IG-TC-005`.

## IG-M03 Día

Lista y totales del `date` exacto. “Hoy” usa la fecha local del navegador.

**IG-BUG-003 confirmado por ejecución Node** en `DailyView` `handlePrevDay` / `handleNextDay`:

```text
new Date(año, mes, día)  → setDate(+/- 1) → toISOString().split('T')[0]
```

| Zona | Día anterior de 2026-01-15 |
| --- | --- |
| America/Argentina/Buenos_Aires | 2026-01-14 (correcto) |
| Europe/Madrid | 2026-01-13 |
| Asia/Kolkata | 2026-01-13 |

En Argentina el botón no falla. En husos UTC+ sí. Si el único uso es Argentina, la severidad baja; el código igual es frágil.

Caso: `IG-TC-006`.

## IG-M04 Categorías

Porcentaje de la categoría sobre el total del tipo en el mes. Subcategoría vacía se muestra como “General”.

**IG-BUG-002 confirmado por código:** `handleOpenAddTxWithCategory` recibe `categoryId` y no lo usa. El modal vuelve a la primera categoría del tipo. Desde el detalle de Nafta se abre Compra de Insumos. Una corrida Playwright del relevamiento vio `naftaSelected: false`.

### IG-HU-03 Registrar en la categoría que estoy mirando

Como emprendedor, quiero que “registrar en Nafta” abra el movimiento ya en Nafta, para no cargarlo en otra categoría.

Casos: `IG-TC-007`, `IG-TC-008`.

## IG-M05 Historial y alta

Modal: monto `> 0`, fecha requerida. Categoría desconocida cae en `otro` / “Egreso General” o “Ingreso General”. Esas categorías no están en el catálogo por defecto.

Filtros del historial: texto, tipo, categoría, medio de pago, rango de fechas por comparación de `YYYY-MM-DD`. El medio `otro` existe en el tipo y no está en el filtro.

El CSV lanzado desde el historial exporta **todos** los movimientos, no el filtro activo (IG-BUG-005). El CSV del mes, dentro del modal de export, sí filtra por mes.

### IG-HU-04 Cargar un egreso

Como emprendedor, quiero registrar un egreso con monto, fecha y categoría, para que baje el balance del mes.

```gherkin
Escenario: monto cero
  Cuando guardo un egreso con monto 0
  Entonces veo un aviso y el movimiento no se crea

Escenario: monto válido
  Cuando guardo 2500 en Nafta con la fecha de hoy
  Entonces aparece en el día y en el mes
```

Casos: `IG-TC-009`, `IG-TC-010`, `IG-TC-011`.

## IG-M06 Exportación y reset

Import JSON: valida cada movimiento; si uno falla, no aplica una parte. Reemplaza todo, no fusiona. Requiere validación.

**IG-BUG-001 confirmado:** `ResetDataModal` exige `totalTransactionsCount` y `App.tsx` no se la pasa. El texto queda “Actualmente tienes  movimientos registrados”. Observado también en Playwright durante el relevamiento.

En nube, `replaceAllTransactionsInSupabase` borra y después inserta. Si el insert falla a la mitad, la base puede quedar incompleta (IG-BUG-006, potencial, no ejecutado contra Supabase).

Casos: `IG-TC-012`, `IG-TC-013`, `IG-TC-014`.

## Código que no forma parte del producto

`Navbar.tsx` (calculadora y moneda) no está importado. `loadCurrencySymbol` no se usa. `@google/genai` no se llama.

## Bugs

| ID | Estado | Resumen |
| --- | --- | --- |
| IG-BUG-001 | Confirmado | El modal de reset no recibe la cantidad de movimientos |
| IG-BUG-002 | Confirmado | Abrir el alta desde una categoría ignora esa categoría |
| IG-BUG-003 | Confirmado en UTC+ | El día anterior/siguiente usa `toISOString` y en España se corre un día. En Argentina no. |
| IG-BUG-004 | Potencial | “Ver todos los del mes” abre el día de hoy |
| IG-BUG-005 | Potencial | El CSV del historial ignora los filtros |
| IG-BUG-006 | Potencial | Reemplazar en Supabase no es atómico |
