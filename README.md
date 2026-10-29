# Web multiusos

Next.js 16 + Prisma 7 (Neon) + Cloudflare R2. Cada sección vive en su propio route group de `app/`:

- `app/(votacion)`: votación de regalos. Cada persona vota de 1 a 5 estrellas con su link de invitación.
- `app/(cumple)`: saludo de cumpleaños en formato "historias", pensado para móvil.

## Rutas

| Ruta | Qué hace |
| --- | --- |
| `/i/<token>` | Link de invitación: guarda el token en una cookie y redirige a `/votar`. Abrirlo de nuevo retoma la votación. |
| `/votar` | Portada de la votación (o aviso de link inválido) y lista de regalos con carrusel, lightbox con zoom, estrellas y comentario opcional. Cada clic se guarda al instante. |
| `/admin` | Panel protegido por contraseña: regalos (CRUD, imágenes, orden), links, votos y abrir/cerrar la votación. |
| `/` | Saludo de cumpleaños: pide la contraseña (`BIRTHDAY_PASSWORD`) y luego muestra el sobre animado → tarjetas del mensaje → escena 3D de la luna → pastel → cupón de beso. La sesión dura un año en ese dispositivo. |

## Saludo de cumpleaños

Todo el contenido sale de env vars (ver `.env.example`), nada queda en el código:

- `BIRTHDAY_MESSAGE`: el mensaje completo; `||` separa una tarjeta de la siguiente.
- `BIRTHDAY_PHOTOS`: keys de R2 (o URLs) separadas por coma, en el orden de las tarjetas. Una entrada vacía (`a.jpg,,c.jpg`) deja esa tarjeta sin foto.
- `BIRTHDAY_TEXT_TOP`: números de tarjeta (desde 1) que muestran el texto arriba en vez de abajo, ej: `"7"` o `"3,7"`.
- `BIRTHDAY_SONG`: MP3 en R2. Empieza al tocar el sobre (los navegadores no permiten audio sin un toque previo).
- `BIRTHDAY_MOON_PHRASE` / `BIRTHDAY_COUPON`: si se omiten, no se muestran la escena de la luna o el cupón.
- `BIRTHDAY_PASSWORD` / `BIRTHDAY_PASSWORD_HINT`: contraseña que se pide al entrar (no distingue mayúsculas) y una pista opcional. Cambiar la contraseña cierra las sesiones abiertas.
- `BIRTHDAY_AGE`: las velas del pastel toman la forma de esos números.

Las velas se apagan tocándolas o soplando al micrófono (requiere HTTPS, que Vercel ya da). Al cambiar una env var en Vercel hay que volver a desplegar.

## Puesta en marcha

1. Copia `.env.example` a `.env` y completa los valores.
2. `pnpm install` (genera el cliente de Prisma en `generated/prisma`).
3. `pnpm db:migrate` para crear las tablas en Neon.
4. `pnpm dev` y entra a `/admin`.

### Neon

- `DATABASE_URL`: connection string **pooled** (host con `-pooler`). La usa la app.
- `DIRECT_URL`: connection string **directa**. La usa la CLI de Prisma para las migraciones.

### Cloudflare R2

1. Crea un bucket y habilita el acceso público (dominio `r2.dev` o uno propio) → `NEXT_PUBLIC_R2_PUBLIC_URL`.
2. Crea un API token con permiso de lectura/escritura sobre el bucket → `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
3. Configura CORS en el bucket para que el navegador pueda subir con la URL firmada:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://TU-DOMINIO.vercel.app"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

### Vercel

Configura las mismas variables de entorno del `.env`. El `postinstall` genera el cliente de Prisma en cada deploy. Las migraciones se aplican con `pnpm db:deploy`.

## Notas

- Las estrellas (1..5) se validan en código (`app/votar/actions.ts`), no con un `CHECK` en la base.
- Al borrar un regalo o una imagen solo se borra el registro; el archivo queda en R2.
- `next/image` optimiza las imágenes de R2 (las sirve en WebP/AVIF y redimensionadas), por eso no se convierten al subirlas.
