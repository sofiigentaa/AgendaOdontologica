# Análisis funcional y de calidad — sistemas de gestión

Paquete de QA generado por lectura de código y, donde se indica, por ejecución puntual. No modifica la lógica de ninguna aplicación.

## Cómo leerlo

1. [00 — Inventario y plan de análisis](./00-inventario-y-plan.md)
2. Documentación módulo por módulo:
   - [Agenda Odontológica](./sistemas/01-agenda-odontologica.md)
   - [Agenda Médica](./sistemas/02-agenda-medica.md)
   - [Sistema Kiosco](./sistemas/03-sistema-kiosco.md)
   - [Candy Salón de Eventos](./sistemas/04-candy-salon.md)
   - [Gestión de Ingresos y Gastos](./sistemas/05-ingresos-gastos.md)
3. [Oportunidades Playwright](./06-playwright.md)
4. [Preguntas y requisitos faltantes](./07-preguntas-y-requisitos-faltantes.md)

## Catálogos (CSV)

| Archivo | Contenido |
| --- | --- |
| [csv/modulos.csv](./csv/modulos.csv) | Módulos, pantallas y actores |
| [csv/historias-usuario.csv](./csv/historias-usuario.csv) | Historias y criterios Gherkin |
| [csv/casos-prueba.csv](./csv/casos-prueba.csv) | Casos manuales con el formato pedido |
| [csv/bugs.csv](./csv/bugs.csv) | Defectos confirmados y potenciales |
| [csv/trazabilidad.csv](./csv/trazabilidad.csv) | Funcionalidad → historia → casos → bugs |
| [csv/preguntas-funcionales.csv](./csv/preguntas-funcionales.csv) | Preguntas abiertas al equipo funcional |

## Criterio de evidencia

- **Confirmado:** el comportamiento se reprodujo (Node o Playwright) o el código hace el efecto de forma directa e inequívoca (por ejemplo, una prop obligatoria que no se pasa).
- **Potencial — análisis estático:** el código sugiere el defecto, pero no se ejecutó el flujo en la aplicación.
- **Requiere validación funcional:** el código no define la regla de negocio. No se inventa.
