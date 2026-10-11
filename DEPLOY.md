# Cómo publicar la Agenda en Render con Supabase

## 1. Supabase (base de datos)
1. Crear un proyecto en https://supabase.com (región São Paulo).
2. **SQL Editor → New query**: pegar `supabase/schema.sql` y tocar **Run**.
   Crea las tablas y activa RLS: la API pública de Supabase no puede leer los datos de los pacientes.
3. **Connect → Session pooler**: copiar la cadena y reemplazar `[YOUR-PASSWORD]`.
   Usar el *pooler*, no la "Direct connection".

## 2. Render (servidor)
1. **New → Blueprint** → este repositorio.
2. Cargar `DATABASE_URL`, `CONSULTORIO_PASSWORD` (12+ caracteres), `CONSULTORIO_EMAIL` y, si se usa, `GEMINI_API_KEY`.
   `SESSION_SECRET` y `ADMIN_API_TOKEN` se generan solas.
3. **Apply**.

## Si ya está publicada (servicio existente)
En el servicio actual → **Environment**, verificar que existan `NODE_ENV=production`,
`SESSION_SECRET` (32+ caracteres) y `ADMIN_API_TOKEN`. Sin `NODE_ENV=production` la
contraseña por defecto es "admin123" y el volcado de datos queda abierto.

## Links de confirmación por WhatsApp
Ahora van firmados (no se pueden adivinar). Los links que se mandaron **antes** de esta
versión dejan de funcionar; si hace falta, poner `ALLOW_LEGACY_PUBLIC_LINKS=true` unos días.
