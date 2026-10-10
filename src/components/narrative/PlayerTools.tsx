"use client";
import { useState } from "react";
import { z } from "zod";
import { draftSchema, createDraft } from "@/lib/draft";
import { createStory, downloadJSON, storySchema } from "@/lib/story";
import { usePlayer } from "./PlayerProvider";
const backupSchema = z
  .object({
    format: z.literal("hogwarts-player-backup"),
    version: z.literal(1),
    draft: draftSchema,
    story: storySchema,
  })
  .refine(
    (p) => p.draft.id === p.story.admissionId,
    "O registro e a história não pertencem ao mesmo personagem.",
  );
export function PlayerStatus() {
  const { status, storageError, saveNow } = usePlayer();
  return (
    <>
      <p role="status" className="save-status">
        {status}
      </p>
      {storageError && (
        <div className="warning" role="alert">
          <p>
            O armazenamento pode estar indisponível ou conter uma cópia que não
            conseguimos ler. Preserve seus arquivos antes de substituir dados.
            As mudanças atuais ficam em memória.
          </p>
          <button className="button secondary" onClick={() => void saveNow()}>
            Tentar salvar novamente
          </button>
        </div>
      )}
    </>
  );
}
export function PlayerTools({
  onRestore,
}: { onRestore?: (stepId?: string) => void } = {}) {
  const { player, replace, saveNow } = usePlayer();
  const [message, setMessage] = useState("");
  const [reset, setReset] = useState(false);
  if (!player) return null;
  async function restore(file: File | undefined) {
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith(".json") || file.size > 2_000_000)
        throw new Error("Escolha um backup JSON de até 2 MB.");
      const parsed = backupSchema.safeParse(JSON.parse(await file.text()));
      if (!parsed.success)
        throw new Error(
          "Backup inválido. Use um backup completo da história, versão 1.",
        );
      if (
        !window.confirm(
          "Substituir a história atual por esta cópia? Guarde um backup antes se quiser preservá-la.",
        )
      )
        return;
      replace(parsed.data);
      onRestore?.(parsed.data.story.experienceStep);
      if (await saveNow()) {
        setMessage("História restaurada.");
      } else
        setMessage(
          "História recuperada em memória; salve ou baixe uma cópia antes de sair.",
        );
    } catch (e) {
      setMessage(
        e instanceof SyntaxError
          ? "JSON inválido."
          : e instanceof Error
            ? e.message
            : "Não foi possível restaurar.",
      );
    }
  }
  return (
    <section className="backup-tools">
      <h2>Preserve sua história</h2>
      <p className="fine-print">
        Tudo fica neste navegador. Baixe um backup completo para continuar em
        outro dispositivo ou recuperar respostas. O backup é um rascunho; a
        ficha do Mestre é exportada na revisão final.
      </p>
      <div className="backup-actions">
        <button
          className="button secondary"
          onClick={() =>
            downloadJSON(
              { format: "hogwarts-player-backup", version: 1, ...player },
              "hogwarts-1890-historia-backup.json",
            )
          }
        >
          Baixar backup completo
        </button>
        <label className="file-button">
          Restaurar história
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              void restore(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button className="text-button" onClick={() => setReset(true)}>
          Recomeçar história
        </button>
      </div>
      {message && (
        <p role="alert" className="warning">
          {message}
        </p>
      )}
      {reset && (
        <div className="warning">
          <p>
            Isso substituirá o registro e a história atuais. Deseja começar um
            novo personagem?
          </p>
          <button className="button secondary" onClick={() => setReset(false)}>
            Cancelar
          </button>
          <button
            className="button"
            onClick={async () => {
              const draft = createDraft();
              replace({ draft, story: createStory(draft.id) });
              await saveNow();
              setReset(false);
              setMessage(
                "Nova história iniciada. Volte ao Capítulo I para preencher o registro.",
              );
            }}
          >
            Confirmar nova história
          </button>
        </div>
      )}
    </section>
  );
}
