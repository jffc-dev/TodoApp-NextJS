import { requireAdmin } from "@/lib/admin-auth";
import { getCurrentPoll } from "@/lib/poll";
import { updatePoll } from "./actions";

export default async function PollPage() {
  await requireAdmin();
  const poll = await getCurrentPoll();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Votación</h1>
      <form action={updatePoll.bind(null, poll.id)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Título (lo ven los votantes)</span>
          <input name="name" required defaultValue={poll.name} className="input" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isOpen" defaultChecked={poll.isOpen} className="size-4" />
          <span className="text-sm">Votación abierta (si se cierra, nadie puede votar ni cambiar votos)</span>
        </label>
        <div>
          <button type="submit" className="btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
