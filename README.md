# Votación de regalos

Next.js 16 + Prisma 7 (Neon) + Cloudflare R2. Cada persona vota los regalos de 1 a 5 estrellas usando su link de invitación.

## Rutas

| Ruta | Qué hace |
| --- | --- |
| `/i/<token>` | Link de invitación: guarda el token en una cookie y redirige a `/votar`. Abrirlo de nuevo retoma la votación. |
| `/votar` | Lista de regalos con carrusel, lightbox con zoom, estrellas y comentario opcional. Cada clic se guarda al instante. |
| `/admin` | Panel protegido por contraseña: regalos (CRUD, imágenes, orden), links, votos y abrir/cerrar la votación. |

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
