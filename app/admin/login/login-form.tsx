"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        required
        autoFocus
        className="input"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
