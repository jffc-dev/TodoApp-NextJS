import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { prisma } from "@/lib/db";
import { imageUrl } from "@/lib/images";
import { deleteGift, updateGift } from "../actions";
import { GiftForm } from "../gift-form";
import { ImageManager } from "../image-manager";

export default async function EditGiftPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const gift = await prisma.gift.findUnique({
    where: { id },
    include: { images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });
  if (!gift) notFound();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Editar regalo</h1>
        <ImageManager
          giftId={gift.id}
          images={gift.images.map((img) => ({ id: img.id, src: imageUrl(img.r2Key) }))}
        />
      </section>

      <section>
        <GiftForm
          action={updateGift.bind(null, gift.id)}
          submitLabel="Guardar cambios"
          initial={{
            name: gift.name,
            description: gift.description ?? "",
            price: gift.price?.toString() ?? "",
            link: gift.link ?? "",
            isActive: gift.isActive,
          }}
        />
      </section>

      <section className="border-t border-border pt-6">
        <form action={deleteGift.bind(null, gift.id)}>
          <ConfirmSubmit
            message={`¿Eliminar "${gift.name}"? También se borran sus votos.`}
            className="btn border border-danger text-danger"
          >
            Eliminar regalo
          </ConfirmSubmit>
        </form>
      </section>
    </div>
  );
}
