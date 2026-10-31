# Cómo publicar la Agenda en Render con Supabase

## 1. Supabase (base de datos)
1. Crear un proyecto en https://supabase.com (región São Paulo).
2. **SQL Editor → New query**: pegar `supabase/schema.sql` y tocar **Run**.
   Crea las tablas y activa RLS: la API pública de Supabase no puede leer los datos de los pacientes.
3. **Connect → Session pooler**: copiar la cadena y reemplazar `[YOUR-PASSWORD]`.
   Usar el *pooler*, no la "Direct connection".

## 2. Render (servidor)
1. **New → Blueprint** → este repositorio.
2. Cargar `DATABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y
   `CONSULTORIO_EMAIL` con los emails autorizados separados por coma. `SESSION_SECRET`
   y `ADMIN_API_TOKEN` se generan solas.
3. **Apply**.

## Cuentas individuales con Supabase Auth
1. En Supabase → **Authentication → Providers → Email**, habilitar el proveedor Email y
   la confirmación de direcciones.
2. En **Authentication → URL Configuration**, agregar `http://localhost:3000` y la URL
   pública de Render a **Redirect URLs**; configurar la URL pública como **Site URL**.
3. Para enviar emails de confirmación y recuperación a cualquier destinatario, configurar
   un SMTP propio en **Authentication → SMTP Settings**. El proveedor integrado de Supabase
   permite hasta 2 emails por hora; ese límite también se aplica a los enlaces de recuperación.
4. En `.env.local` y Render, definir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del
   proyecto. La variable `CONSULTORIO_EMAIL` debe enumerar todas las cuentas autorizadas;
   los registros fuera de esa lista se rechazan.

Cada odontóloga tiene su propia cuenta y contraseña; pacientes y turnos permanecen en la
misma agenda compartida. La contraseña compartida anterior deja de ser válida. En la
demo pública (`DEMO_MODE=true`) se mantiene el acceso de demostración.

## Si ya está publicada (servicio existente)
En el servicio actual → **Environment**, verificar que existan `NODE_ENV=production`,
`SESSION_SECRET` (32+ caracteres), `ADMIN_API_TOKEN`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY` y la lista `CONSULTORIO_EMAIL`. Sin `NODE_ENV=production`,
las protecciones de producción y las restricciones del volcado de datos no se aplican.

## Links de confirmación por WhatsApp
Ahora van firmados (no se pueden adivinar). Los links que se mandaron **antes** de esta
versión dejan de funcionar; si hace falta, poner `ALLOW_LEGACY_PUBLIC_LINKS=true` unos días.
