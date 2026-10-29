import { requireAdmin } from "@/lib/admin-auth";
import { getCurrentPoll, getPollGroups } from "@/lib/poll";
import { createGift } from "../actions";
import { GiftForm } from "../gift-form";

export default async function NewGiftPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string }>;
}) {
  await requireAdmin();
  const { grupo } = await searchParams;
  const poll = await getCurrentPoll();
  const groups = await getPollGroups(poll.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Nuevo regalo</h1>
      <p className="text-sm text-muted">Las imágenes se agregan después de crear el regalo.</p>
      <GiftForm
        action={createGift}
        groups={groups.map(({ id, name }) => ({ id, name }))}
        initial={{ groupId: groups.find((g) => g.id === grupo)?.id }}
        submitLabel="Crear y agregar imágenes"
      />
    </div>
  );
}
