import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // La CLI (migraciones) usa la conexión directa de Neon; la app usa la pooled.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
