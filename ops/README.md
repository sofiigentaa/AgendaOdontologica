# Publicar los cinco sistemas en Render con Supabase

Un comando crea la base, la cierra y crea el servicio. No hay que repetir el asistente de Render ni pegar SQL a mano.

## Por qué van a Render

GitHub guarda el código. Supabase guarda los datos. Ninguno de los dos sirve la aplicación en una dirección HTTPS.

| Sistema | Qué crea Render | Por qué no alcanza Supabase solo |
| --- | --- | --- |
| Agenda Odontológica | Servidor Node | El login y `DATABASE_URL` tienen que quedar en el servidor. El navegador no debe ver la base. |
| Agenda Médica | Servidor Node | Igual: Prisma se conecta desde el servidor. |
| Candy Salón | Servidor Node | Igual: la sesión y la base viven en Express. |
| Sistema Kiosco | Sitio estático | La pantalla es React. Los datos van directo a Supabase, con login. |
| Ingresos y Gastos | Sitio estático | Igual que el kiosco. |

Cada push a `main` vuelve a publicar solo. El plan free de Render duerme el servidor Node cuando nadie entra; el primero que abre espera unos segundos.

## Cómo queda cerrada la base

Servidor (agenda odontológica, agenda médica, Candy):

- La clave `anon` no se carga en Render.
- El SQL activa RLS y le saca todos los permisos a `anon` y a `authenticated`.
- Solo entra la conexión del servidor (`DATABASE_URL`, usuario dueño de Postgres).

Pantalla que habla directo con Supabase (kiosco e ingresos):

- La clave `anon` es pública: así funciona el navegador. No es la contraseña de la base.
- Sin iniciar sesión no se lee ninguna fila (`REVOKE` a `anon` + RLS).
- Cada usuario ve solo sus filas.
- El registro público queda apagado. El comando crea una sola cuenta.

## Lo único que hace falta una vez

1. Una API key de Render: [dashboard.render.com/settings#api-keys](https://dashboard.render.com/settings#api-keys).
2. Un token de Supabase: [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
3. En Render, la cuenta de GitHub `sofiigentaa` conectada (Account → GitHub). Si nunca se conectó, es un clic. El comando no puede autorizar GitHub por vos.

Copiá `ops/provision.env.example` a `.provision.env` en la raíz y completá las tres variables.

```bash
node ops/provision.mjs
```

Las contraseñas se generan solas y quedan en `ops/salida/credenciales.txt` (no se sube a git). Ahí están la URL de cada sistema y con qué email y clave se entra.

Para uno solo:

```bash
node ops/provision.mjs --only sistema-kiosco
```

Para ver el plan sin crear nada:

```bash
node ops/provision.mjs --dry-run
```

Si el comando se corta, se vuelve a correr: retoma lo que ya creó.

## Límite del plan gratis de Supabase

El plan gratis suele permitir dos proyectos activos. Son cinco sistemas. Si Supabase rechaza el tercero, el comando se detiene y dice cuál falta. Se puede pausar un proyecto que no uses, o pasar la organización a un plan que acepte más proyectos, y volver a correr el mismo comando.
