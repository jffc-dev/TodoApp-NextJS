"use client";

import { useState, useTransition } from "react";
import { saveComment, saveVote } from "@/app/votar/actions";
import { GiftGallery, type GalleryImage } from "@/components/gift-gallery";
import { StarRating } from "@/components/star-rating";

export type VotingGift = {
  id: string;
  name: string;
  description: string | null;
  link: string | null;
  images: GalleryImage[];
  stars: number;
  comment: string;
};

export type VotingGroup = {
  id: string;
  name: string;
  gifts: VotingGift[];
};

export function VotingBoard({
  pollName,
  isOpen,
  groups,
}: {
  pollName: string;
  isOpen: boolean;
  groups: VotingGroup[];
}) {
  const gifts = groups.flatMap((group) => group.gifts);
  // Estrellas por regalo; se actualiza al instante y se guarda en segundo plano.
  const [stars, setStars] = useState<Record<string, number>>(() =>
    Object.fromEntries(gifts.map((g) => [g.id, g.stars])),
  );
  const votedIn = (list: VotingGift[]) => list.filter((g) => stars[g.id] > 0).length;
  const voted = votedIn(gifts);
  const progress = gifts.length ? (voted / gifts.length) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-xl pb-16">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 pb-3 pt-4 backdrop-blur">
        <h1 className="text-lg font-semibold">{pollName}</h1>
        {gifts.length > 0 && (
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm tabular-nums text-muted">
              {voted} de {gifts.length}
            </span>
          </div>
        )}
        {groups.length > 1 && (
          <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 scrollbar-none">
            {groups.map((group) => {
              const done = votedIn(group.gifts) === group.gifts.length;
              return (
                <a
                  key={group.id}
                  href={`#grupo-${group.id}`}
                  className={`shrink-0 rounded-full border px-3 py-1 text-sm whitespace-nowrap ${
                    done ? "border-accent/60 bg-accent/10" : "border-border bg-card"
                  }`}
                >
                  {group.name}{" "}
                  <span className="tabular-nums text-muted">
                    {votedIn(group.gifts)}/{group.gifts.length}
                  </span>
                </a>
              );
            })}
          </nav>
        )}
        {!isOpen && (
          <p className="mt-2 text-sm text-muted">
            La votación está cerrada. Ya no se pueden cambiar votos.
          </p>
        )}
      </header>

      {gifts.length === 0 ? (
        <p className="px-4 py-16 text-center text-muted">Todavía no hay regalos para votar.</p>
      ) : (
        groups.map((group) => (
          // scroll-mt deja espacio para el header fijo al saltar desde los chips.
          <section key={group.id} id={`grupo-${group.id}`} className="scroll-mt-32 pt-6">
            {groups.length > 1 && (
              <h2 className="px-4 pb-3 text-xl font-semibold">{group.name}</h2>
            )}
            <ul className="flex flex-col gap-6 sm:px-4">
              {group.gifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  stars={stars[gift.id]}
                  disabled={!isOpen}
                  onStars={(value) => setStars((prev) => ({ ...prev, [gift.id]: value }))}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      {gifts.length > 0 && voted === gifts.length && (
        <p className="px-4 pt-8 text-center text-muted">
          ¡Listo! Votaste todos los regalos. Puedes cambiar tus votos mientras la votación siga
          abierta.
        </p>
      )}
    </main>
  );
}

function GiftCard({
  gift,
  stars,
  disabled,
  onStars,
}: {
  gift: VotingGift;
  stars: number;
  disabled: boolean;
  onStars: (value: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function rate(value: number) {
    const previous = stars;
    onStars(value);
    setError(null);
    startTransition(async () => {
      const result = await saveVote(gift.id, value);
      if (!result.ok) {
        onStars(previous);
        setError(result.error);
      }
    });
  }

  return (
    <li className="overflow-hidden border-y border-border bg-card sm:rounded-2xl sm:border">
      <GiftGallery images={gift.images} alt={gift.name} />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h2 className="text-lg font-semibold leading-tight">{gift.name}</h2>
          {gift.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted">{gift.description}</p>
          )}
          {gift.link && (
            <a
              href={gift.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm underline underline-offset-2"
            >
              Ver producto
            </a>
          )}
        </div>

        <StarRating
          value={stars}
          onChange={rate}
          disabled={disabled}
          label={`Calificar ${gift.name}`}
        />
        {error && <p className="text-sm text-danger">{error}</p>}

        {stars > 0 && <CommentBox giftId={gift.id} initial={gift.comment} disabled={disabled} />}
      </div>
    </li>
  );
}

function CommentBox({
  giftId,
  initial,
  disabled,
}: {
  giftId: string;
  initial: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(initial.length > 0);
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = text.trim() !== saved.trim();

  function save() {
    startTransition(async () => {
      const result = await saveComment(giftId, text);
      if (result.ok) {
        setSaved(text);
        setStatus("Guardado");
      } else {
        setStatus(result.error);
      }
    });
  }

  if (!open) {
    if (disabled) return null;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-sm text-muted underline underline-offset-2"
      >
        Agregar comentario (opcional)
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setStatus(null);
        }}
        maxLength={500}
        rows={2}
        disabled={disabled}
        placeholder="¿Algo que quieras agregar?"
        className="input resize-none text-sm"
      />
      <div className="flex items-center justify-end gap-3">
        {status && !dirty && <span className="text-xs text-muted">{status}</span>}
        {dirty && !disabled && (
          <button type="button" onClick={save} disabled={pending} className="btn-primary py-1.5">
            {pending ? "Guardando…" : "Guardar comentario"}
          </button>
        )}
      </div>
    </div>
  );
}
