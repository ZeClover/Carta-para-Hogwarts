"use client";
import { useEffect, useRef, useState } from "react";
/** Original low-volume paper cue. No media URL, autoplay or narrative audio. */
export function usePaperAudio(phase: string) {
  const audio = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false),
    [notice, setNotice] = useState("");
  async function toggle() {
    if (enabled) {
      setEnabled(false);
      try {
        await audio.current?.suspend();
      } catch {}
      return;
    }
    try {
      if (!audio.current || audio.current.state === "closed")
        audio.current = new AudioContext();
      await audio.current.resume();
      if (audio.current.state !== "running")
        throw new Error("Audio unavailable");
      setEnabled(true);
      setNotice("");
    } catch {
      setEnabled(false);
      setNotice("O som não está disponível. Você pode continuar em silêncio.");
    }
  }
  useEffect(() => {
    const context = audio.current;
    if (!enabled || phase !== "turn" || !context || context.state !== "running")
      return;
    const buffer = context.createBuffer(
      1,
      Math.floor(context.sampleRate * 0.09),
      context.sampleRate,
    );
    const values = buffer.getChannelData(0);
    let seed = 1890;
    for (let i = 0; i < values.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      values[i] =
        (seed / 4294967296 - 0.5) * Math.sin((Math.PI * i) / values.length);
    }
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    gain.gain.value = 0.045;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    return () => {
      try {
        source.stop();
      } catch {}
    };
  }, [phase, enabled]);
  useEffect(
    () => () => {
      void audio.current?.close().catch(() => {});
    },
    [],
  );
  return { enabled, notice, toggle };
}
