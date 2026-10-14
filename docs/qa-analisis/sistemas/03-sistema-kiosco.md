# Sistema Kiosco — Granja y Kiosco Don Ramón

Repositorio: `sofiigentaa/SistemaKiosco`. No hay router: la navegación es por pestañas. No hay tests en el repo. No se ejecutó la UI en esta corrida.

## Actores

| Modo | Acceso |
| --- | --- |
| Sin variables de Supabase | Entra directo, datos demo en `localStorage` (`kiosco_*_v3`). Sin login. |
| Con Supabase | `AuthGate` exige email y contraseña. RLS: `owner = auth.uid()`. La documentación pide desactivar el registro público y compartir una sola cuenta. |

No hay rol cajero ni rol dueño. Quien entra puede vender, cambiar precios y borrar datos.

## SK-M01 Acceso

### SK-HU-01 Entrar en modo nube

Como dueño del kiosco, quiero que la app pida contraseña cuando está publicada, para que un visitante no vea el stock.

```gherkin
Escenario: Supabase configurado y sin sesión
  Entonces veo el formulario de login
  Y no veo el punto de venta

Escenario: modo local de desarrollo
  Dado que no hay URL ni clave de Supabase
  Entonces la app abre con datos de demostración
```

Casos: `SK-TC-001`, `SK-TC-002`.

## SK-M02 Golondrina

Propone y no aplica hasta que alguien aprueba. Log encadenado SHA-256.

| Propuesta | Condición en código |
| --- | --- |
| Ingreso habitual | Al menos 2 ingresos con la misma cantidad y regularidad aproximada |
| Liquidación por vencimiento | Vence en 0 a 3 días, hay stock, no tiene `liquidationApplied`. Precio nuevo: −20 %, redondeo a $10, piso el costo |
| Reposición | `stock <= minStock`. Cantidad sugerida `max(minStock * 2 - stock, 1)` |
| Fiados | Fiado sin cobrar hace 7 días o más |

La pantalla de alertas usa **7 días** para “por vencer” y la liquidación de inventario filtra **15 días** y stock ≥ 20. Tres umbrales distintos. Requiere validación: ¿cuál es el del negocio?

### SK-HU-02 Aprobar una reposición

Como quien repone, quiero ver una propuesta y aceptarla yo, para no cambiar precios ni stock sin mirar.

Caso: `SK-TC-003`.

## SK-M03 Punto de venta

- No suma unidades si `stock <= 0`. La cantidad del carrito no pasa el stock.
- Fiado: nombre obligatorio.
- Efectivo: si se informa un monto mayor a 0 y menor al total, error.
- Descuento de ticket: 0, 5, 10, 15 o 20 % sobre el subtotal. `total = max(0, subtotal - descuento)`.
- `totalProfit = total final - costo`. El descuento no se prorratea en `SaleItem.profit`.
- Ítem libre: costo = 60 % del precio, stock 999, id `custom-*`, no entra al catálogo.
- No se exige turno de caja abierto para vender. Requiere validación.

### SK-HU-03 Cobrar en el mostrador

Como cajero, quiero armar la venta y descontar el stock al confirmar, para no anotar la salida a mano.

```gherkin
Escenario: venta en efectivo con stock
  Dado un producto con stock 5 y precio 1000
  Cuando llevo 2 y confirmo en efectivo
  Entonces el stock queda en 3
  Y la venta queda completada

Escenario: fiado sin nombre
  Cuando elijo fiado y dejo el nombre vacío
  Entonces la venta no se confirma
```

Casos: `SK-TC-004` a `SK-TC-008`.

## SK-M04 Inventario

Alta: nombre obligatorio y `salePrice > 0`. Costo y stock pueden quedar en 0: requiere validación. Cambiar la fecha de vencimiento pone `liquidationApplied` en false. Reabastecer también. Aumento masivo: `round(precio * (1 + pct/100))` por categoría o todos.

Casos: `SK-TC-009`, `SK-TC-010`.

## SK-M05 Alertas

- Stock bajo: `0 < stock <= minStock`.
- Agotado: `stock <= 0`.
- Por vencer: fecha, sin liquidación aplicada, días entre 0 y 7.
- Vencido: días < 0.

La rebaja desde la fila de un producto no marca `liquidationApplied`. El modal masivo sí. El producto puede seguir en “por vencer” después de una rebaja manual (SK-BUG-003).

`LiquidationModal` declara un modo `LOW_SALES` que no filtra nada: inalcanzable.

### SK-HU-04 Ver qué se está por vencer

Como quien compra mercadería, quiero una lista de productos que vencen dentro de una semana, para liquidarlos o darlos de baja.

Caso: `SK-TC-011`.

## SK-M06 Caja

Apertura: fondo `>= 0`. Presets de UI 5.000 a 30.000; default 15.000. Requiere validación si el fondo es libre.

Efectivo esperado:

```text
fondo inicial
+ ventas completadas en Efectivo con fecha >= apertura
+ fiados cobrados en Efectivo con fiadoPaidAt >= apertura
```

Una venta fiada no entra al cajón hasta que se cobra. Si se cobra con Mercado Pago o débito, no suma al efectivo. El cierre guarda el efectivo contado y la diferencia. Historial de cierres: tope 365.

### SK-HU-05 Arquear la caja

Como cajero, quiero comparar el efectivo contado con el esperado, para ver si el turno cierra.

Casos: `SK-TC-012`, `SK-TC-013`.

## SK-M07 Historial

Filtros por día local: hoy, ayer, 7, 30, todo; medio de pago; fiados pendientes. `cancelSale` existe en el contexto y no tiene botón. Al usarse, el movimiento de stock calcula `newStock` sobre un stock ya restaurado (SK-BUG-002). Sin UI, el usuario no llega ahí.

Caso: `SK-TC-014`.

## SK-M08 Reportes

Períodos DAY / WEEK / MONTH / ALL sobre ventas `completada`. El filtro “Hoy” de reportes usa la fecha UTC de `toISOString`. El KPI del encabezado usa el día local. Una venta de la noche en Argentina puede caer en días distintos (SK-BUG-001). No se ejecutó la UI; el código de las dos funciones es distinto.

Caso: `SK-TC-015`.

## SK-M09 Asistente

Palabras clave sobre los datos ya cargados. No llama a un modelo. WhatsApp de soporte: `VITE_SOPORTE_WHATSAPP` o el default del código.

Caso: `SK-TC-016` (regresión de que no escribe datos solo).

## Bugs

| ID | Estado | Resumen |
| --- | --- | --- |
| SK-BUG-001 | Potencial | “Hoy” del reporte en UTC y el del encabezado en hora local |
| SK-BUG-002 | Potencial | `cancelSale` deja `previousStock` / `newStock` inconsistentes; no hay botón |
| SK-BUG-003 | Potencial | Rebaja manual en alertas no marca liquidación aplicada |
| SK-BUG-004 | Potencial | El descuento del ticket no baja la ganancia de cada ítem |
| SK-BUG-005 | Potencial | Borrar todos los datos es un clic, sin escribir una palabra de confirmación |
| SK-BUG-006 | Documentación | El README habla de liquidación automática; el código solo propone o aplica con una acción de la persona |

## Reglas que no hay que dar por hechas

Vender con la caja cerrada, umbral único de vencimiento, prorrateo del descuento, ítem de monto libre contra el inventario, y si hace falta anulación con motivo.
