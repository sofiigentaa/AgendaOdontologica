# Base de datos, sync y acceso

Nada es “100% seguro”. Con estos pasos sí se cierra el acceso público a pacientes y turnos.

## Obligatorio en Render (Environment)

| Variable | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `CONSULTORIO_PASSWORD` | clave **larga** (≥ 12), distinta de `admin123`, solo Marie y Yani |
| `SESSION_SECRET` | 32+ caracteres aleatorios (`openssl rand -hex 32`) |
| `DATABASE_URL` | Internal Database URL del Postgres de Render |
| `CONSULTORIO_EMAIL` | (recomendado) emails permitidos, separados por coma |

Sin `CONSULTORIO_PASSWORD` y `SESSION_SECRET` **el servidor no arranca** en producción.

Nunca pongas estas variables en GitHub ni en el README.

## Postgres (para que no se pierda al reiniciar)

1. Render → **New** → **PostgreSQL**.
2. Copiá **Internal Database URL** a `DATABASE_URL`.
3. En tu PC (External URL) o shell de Render:

```bash
cd "Escritorio/Proyectos Personales/Agenda/mi-agenda(8)"
DATABASE_URL="postgresql://..." npm run db:push
```

4. **Manual Deploy** del web service.

## Cómo lo usan Marie y Yani

1. Misma URL del deploy.
2. Email autorizado + `CONSULTORIO_PASSWORD`.
3. La sesión dura 12 horas (cookie HttpOnly).

## Qué queda protegido

- Login en el servidor (no alcanza con “cualquier clave de 4 letras”).
- `/api/sync/*`, dump, borrar turnos, asistente: requieren sesión.
- En producción, `admin123` **no funciona**.
- Máximo 8 intentos de login cada 15 minutos por IP.
- Claves de Supabase ya no están en el código.

## Qué no cubre el código

- Si publicás la URL y alguien adivina o filtra la clave, entra.
- Los datos en el celular/PC siguen en `localStorage` de ese navegador.
- El link público de confirmar turno (`/api/public/appointment/:id`) sigue existiendo a propósito (WhatsApp del paciente).
- Tenés que **rotar** la clave de Supabase si alguna vez estuvo en GitHub.
