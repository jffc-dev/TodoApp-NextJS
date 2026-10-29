"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="btn-ghost shrink-0 px-3 py-1 text-xs"
    >
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
