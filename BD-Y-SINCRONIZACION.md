# Base de datos y uso PC + celular

El código **ya sabe hablar con PostgreSQL**. Falta crear la BD en Render y poner la URL.

## Qué tenés que hacer en Render (15 min)

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **PostgreSQL**.
2. Nombre: `agenda-odontologica-db`. Plan Free si existe.
3. Cuando esté **Available**, copiá **Internal Database URL**.
4. Abrí el **Web Service** `agendaodontologica-cuvt` → **Environment**.
5. Agregá:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | la Internal Database URL |
| `CONSULTORIO_PASSWORD` | una clave larga, solo para el consultorio (no `admin123` en producción) |
| `NODE_ENV` | `production` |

6. En el web service, **Connect** / linking: vinculá el Postgres si Render lo ofrece.
7. **Manual Deploy**.

8. En tu PC, una vez (con la External Database URL de Render, o en un shell de Render):

```bash
cd "Escritorio/Proyectos Personales/Agenda/mi-agenda(8)"
DATABASE_URL="postgresql://..." npm run db:push
```

Eso crea las tablas (pacientes, turnos, etc.).

## Cómo lo usan Marie y Yani

1. Misma URL: https://agendaodontologica-cuvt.onrender.com  
2. Mismo email del consultorio y la **misma** `CONSULTORIO_PASSWORD`.  
3. PC y celular: al guardar un turno, se manda a `/api/sync/agenda` y queda en Postgres. El otro dispositivo lo ve al recargar o al pulsar **Sincronizar**.

## Login

- En local (sin variable): sigue valiendo `admin123` para los tests.  
- En Render: **solo** la clave `CONSULTORIO_PASSWORD`. Cualquier email con `@`.

## Si no creás la BD

Siguen pudiendo usar **una sola PC**. El sync entre celu y PC **no es fiable** (se pierde al reiniciar Render).
