"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SceneStage } from "./scenes/SceneStage";
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
      <SceneStage
        kind="letter"
        open={open}
        onOpen={() => setOpen(true)}
        onSkip={() => {
          setReduced(true);
          setOpen(true);
        }}
      />
      {open && (
        <article className="invitation">
          <div className="crest" aria-label="Emblema original do projeto">
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
