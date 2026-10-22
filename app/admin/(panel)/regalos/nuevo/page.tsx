import { requireAdmin } from "@/lib/admin-auth";
import { createGift } from "../actions";
import { GiftForm } from "../gift-form";

export default async function NewGiftPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nuevo regalo</h1>
      <p className="text-sm text-muted">Las imágenes se agregan después de crear el regalo.</p>
      <GiftForm action={createGift} submitLabel="Crear y agregar imágenes" />
    </div>
  );
}
