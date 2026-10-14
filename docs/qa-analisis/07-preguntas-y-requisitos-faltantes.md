# Preguntas al equipo funcional y requisitos faltantes

Nada de esta lista está cerrado por el código. Hasta que se responda, los casos de prueba relacionados documentan el comportamiento actual y dejan el resultado de negocio como pendiente.

El detalle fila por fila está en [csv/preguntas-funcionales.csv](./csv/preguntas-funcionales.csv).

## Transversales

1. ¿Hace falta separar recepción, profesional y administración, o una contraseña compartida es la regla?
2. ¿Estos cinco repos se prueban y se entregan como productos distintos? Este paquete los trata así.

## Agenda Odontológica

- ¿“Agendar de todos modos” debe guardar el solape o el servidor debe seguir en 409 y la UI no debe ofrecer el botón?
- Al borrar un paciente con turnos futuros, ¿se bloquea, se cancelan los turnos o se dejan huérfanos como ahora?
- ¿El honorario puede ser negativo si los gastos superan lo cobrado?
- ¿Un turno ya atendido se puede confirmar o cancelar desde el link del paciente?
- ¿Teléfono y email tienen formato obligatorio? ¿Se permiten dos pacientes con el mismo teléfono?

## Agenda Médica

- ¿Existe seña o solo honorarios?
- ¿“Facturado” cuenta como plata percibida en el cierre?
- ¿El cierre debe recalcularse en el servidor?
- ¿Un bloqueo “NO DAR” impide turnos encima?
- ¿El link público puede cambiar un turno atendido o pasado?
- ¿Sigue habiendo una sola agenda, sin profesional?

## Kiosco

- ¿Se puede vender con la caja cerrada?
- Umbral de vencimiento: ¿3, 7 o 15 días?
- ¿La liquidación es siempre con aprobación humana?
- ¿El descuento del ticket debe bajar el margen de cada producto?
- ¿Hace falta anular una venta desde la pantalla?
- ¿El ítem de monto libre entra al inventario?

## Candy

- ¿Cómo se cancela un evento y qué pasa con la seña?
- ¿Un evento realizado puede tener saldo?
- ¿Las devoluciones restan en todas las pantallas de caja?
- ¿Dos eventos el mismo día sin hora están permitidos?
- ¿Restaurar un backup reemplaza la base?
- ¿Feriado usa la tarifa de fin de semana?
- ¿Los precios base 130.000 / 160.000 / 195.000 son configuración fija?

## Ingresos y gastos

- ¿El CSV del historial exporta el filtro o todo?
- ¿El registro rápido usa “hoy” o el mes que se está mirando?
- ¿Importar JSON reemplaza o fusiona?
- ¿Hace falta crear categorías sin resetear las demás?
- ¿El producto se usa solo en Argentina? El desfase de día no aparece en `America/Argentina/Buenos_Aires` y sí en husos UTC+.
