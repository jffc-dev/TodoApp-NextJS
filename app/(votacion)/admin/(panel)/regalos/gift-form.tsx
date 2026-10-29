"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { GiftFormState } from "./actions";

export type GiftFormValues = {
  name: string;
  description: string;
  price: string;
  link: string;
  isActive: boolean;
  groupId: string;
};

export function GiftForm({
  action,
  initial,
  groups,
  submitLabel,
}: {
  action: (prev: GiftFormState, formData: FormData) => Promise<GiftFormState>;
  initial?: Partial<GiftFormValues>;
  groups: { id: string; name: string }[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nombre *</span>
        <input name="name" required defaultValue={initial?.name} className="input" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Grupo</span>
        <select name="groupId" defaultValue={initial?.groupId ?? groups[0]?.id} className="input">
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Descripción</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={initial?.description}
          className="input resize-y"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Precio (solo admin)</span>
          <input
            name="price"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={initial?.price}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Link de compra</span>
          <input
            name="link"
            type="url"
            placeholder="https://"
            defaultValue={initial?.link}
            className="input"
          />
        </label>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          className="size-4 accent-current"
        />
        <span className="text-sm">Visible para votar</span>
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando…" : submitLabel}
        </button>
        <Link href="/admin/regalos" className="btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
