"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
export function Letter() {
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const startLink = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (open) startLink.current?.focus({ preventScroll: true });
  }, [open]);
  return (
    <section
      className={`letter-scene ${open ? "is-open" : ""} ${reduced ? "no-motion" : ""}`}
      aria-label="Sua carta de admissão"
    >
      <button
        className="motion-button"
        aria-pressed={reduced}
        onClick={() => {
          setReduced(!reduced);
          setOpen(true);
        }}
      >
        Pular animação / reduzir movimento
      </button>
      {!open ? (
        <button
          className="envelope"
          onClick={() => setOpen(true)}
          aria-label="Abrir a carta de Hogwarts"
        >
          <span className="envelope-address">
            Ao futuro estudante
            <br />
            <small>Onde sua história começa</small>
          </span>
          <span className="seal" aria-hidden="true">
            H
          </span>
          <span className="envelope-hint">Rompa o lacre para abrir</span>
        </button>
      ) : (
        <article className="invitation">
          <div className="crest" aria-label="Emblema temporário, arte original">
            H<span>✦</span>
          </div>
          <p className="eyebrow">Escola de Magia e Bruxaria</p>
          <h2>Hogwarts</h2>
          <div className="rule" />
          <p>Prezado(a) estudante,</p>
          <p>
            Antes de sua chegada a Hogwarts, solicitamos o preenchimento de seu
            registro de identificação.
          </p>
          <p>Toda grande história começa com alguém, e esta começa com você.</p>
          <p className="signature">
            Secretaria de Admissões
            <br />
            <small>Setembro de 1890</small>
          </p>
          <Link ref={startLink} className="button" href="/criar/I">
            Preencher meu registro <span aria-hidden="true">→</span>
          </Link>
          <p className="fine-print">
            Sete capítulos, uma história. Você pode retornar a qualquer página.
          </p>
        </article>
      )}
    </section>
  );
}
