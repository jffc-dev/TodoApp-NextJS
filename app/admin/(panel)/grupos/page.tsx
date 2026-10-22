import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getCurrentPoll, getPollGroups } from "@/lib/poll";
import { createGroup, deleteGroup, moveGroup, renameGroup } from "./actions";

export default async function GroupsPage() {
  await requireAdmin();
  const poll = await getCurrentPoll();
  const groups = await getPollGroups(poll.id);
  const counts = await prisma.gift.groupBy({
    by: ["groupId"],
    where: { pollId: poll.id },
    _count: true,
  });
  const countFor = (groupId: string) => counts.find((c) => c.groupId === groupId)?._count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Grupos</h1>
        <p className="text-sm text-muted">
          Los votantes ven los regalos separados por grupo, en este orden.
        </p>
      </div>

      <form action={createGroup} className="flex gap-2 rounded-xl border border-border bg-card p-3">
        <input name="name" required placeholder="Ej: Zapatillas" className="input flex-1" />
        <button type="submit" className="btn-primary">
          Crear
        </button>
      </form>

      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
        {groups.map((group, i) => {
          const count = countFor(group.id);
          return (
            <li key={group.id} className="flex items-center gap-3 p-3">
              <div className="flex flex-col">
                <form action={moveGroup.bind(null, group.id, -1)}>
                  <button
                    disabled={i === 0}
                    className="px-1 text-muted disabled:opacity-20"
                    aria-label="Subir"
                  >
                    ▲
                  </button>
                </form>
                <form action={moveGroup.bind(null, group.id, 1)}>
                  <button
                    disabled={i === groups.length - 1}
                    className="px-1 text-muted disabled:opacity-20"
                    aria-label="Bajar"
                  >
                    ▼
                  </button>
                </form>
              </div>

              <form action={renameGroup.bind(null, group.id)} className="min-w-0 flex-1">
                <input
                  name="name"
                  required
                  defaultValue={group.name}
                  aria-label="Nombre del grupo (Enter para guardar)"
                  className="w-full bg-transparent font-medium outline-none"
                />
              </form>

              <span className="shrink-0 text-sm text-muted">{count} regalos</span>

              {count === 0 && groups.length > 1 ? (
                <form action={deleteGroup.bind(null, group.id)}>
                  <ConfirmSubmit
                    message={`¿Eliminar el grupo "${group.name}"?`}
                    className="px-2 text-xs text-danger"
                  >
                    Eliminar
                  </ConfirmSubmit>
                </form>
              ) : (
                <span
                  className="w-[3.75rem] px-2 text-right text-xs text-muted/60"
                  title="Solo se pueden eliminar grupos vacíos (y siempre debe quedar uno)"
                >
                  —
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted">
        Para eliminar un grupo, primero mueve sus regalos a otro grupo desde la edición del regalo.
      </p>
    </div>
  );
}
