"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createDraft, type Draft } from "@/lib/draft";
import { loadDraft, saveDraft } from "@/lib/storage";
import { createStory, type Story } from "@/lib/story";
import { loadStory, saveStory } from "@/lib/local-store";
export type Player = { draft: Draft; story: Story };
type PlayerContext = {
  player: Player | null;
  origin: "loading" | "new" | "restored" | "recovery-error";
  status: string;
  storageError: boolean;
  change: (edit: (p: Player) => Player) => void;
  saveNow: () => Promise<boolean>;
  replace: (p: Player) => void;
};
const Context = createContext<PlayerContext | null>(null);
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [status, setStatus] = useState("Carregando sua história…");
  const [storageError, setStorageError] = useState(false);
  const [origin, setOrigin] = useState<PlayerContext["origin"]>("loading");
  const recoveryBlocked = useRef(false);
  const latest = useRef<Player | null>(null);
  const dirty = useRef(false);
  const change = useCallback((edit: (p: Player) => Player) => {
    if (!latest.current) return;
    const next = edit(latest.current);
    latest.current = next;
    dirty.current = true;
    setPlayer(next);
    setStatus("Mudanças pendentes de salvamento…");
  }, []);
  const replace = useCallback((next: Player) => {
    recoveryBlocked.current = false;
    setOrigin("restored");
    latest.current = next;
    dirty.current = true;
    setPlayer(next);
    setStatus("Salvando…");
  }, []);
  const saveNow = useCallback(async () => {
    const current = latest.current;
    if (!current || recoveryBlocked.current) return false;
    try {
      await saveDraft(current.draft);
      await saveStory(current.story);
      if (latest.current === current) {
        dirty.current = false;
        setStatus("Salvo neste navegador.");
        setStorageError(false);
      }
      return true;
    } catch {
      setStatus("Não foi possível salvar. Baixe um backup antes de sair.");
      setStorageError(true);
      return false;
    }
  }, []);
  useEffect(() => {
    let active = true;
    loadDraft()
      .then(async (value) => {
        const draft = value ?? createDraft();
        const story = (await loadStory(draft.id)) ?? createStory(draft.id);
        if (!active) return;
        const next = { draft, story };
        latest.current = next;
        setPlayer(next);
        setOrigin(value ? "restored" : "new");
        setStatus(
          value
            ? "História recuperada deste navegador."
            : "Seu registro será salvo neste navegador.",
        );
      })
      .catch(() => {
        if (!active) return;
        recoveryBlocked.current = true;
        setOrigin("recovery-error");
        setStorageError(true);
        setStatus(
          "Não foi possível recuperar sua história. Nenhum dado existente foi substituído.",
        );
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!player || !dirty.current || storageError) return;
    const timer = setTimeout(() => {
      void saveNow();
    }, 500);
    return () => clearTimeout(timer);
  }, [player, storageError, saveNow]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const visibility = () => {
      if (
        document.visibilityState === "hidden" &&
        dirty.current &&
        !storageError
      )
        void saveNow();
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [saveNow, storageError]);
  return (
    <Context.Provider
      value={{ player, origin, status, storageError, change, saveNow, replace }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePlayer() {
  const context = useContext(Context);
  if (!context) throw new Error("PlayerProvider ausente.");
  return context;
}
