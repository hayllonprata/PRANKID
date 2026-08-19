"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api, type PersonalBrief, type Product } from "@/lib/api";

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PersonalizeModal({
  product,
  onCancel,
  onConfirm,
}: {
  product: Product;
  onCancel: () => void;
  onConfirm: (brief: PersonalBrief) => void;
}) {
  const [job, setJob] = useState("");
  const [likes, setLikes] = useState("");
  const [colors, setColors] = useState("");
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    startedAtRef.current = Date.now();
    setElapsed(0);
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  async function transcribeBlob(blob: Blob, filename: string) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("audio", blob, filename);
      const result = await api<{
        text: string;
        audioUrl: string;
        job?: string;
        likes?: string;
        colors?: string;
      }>("/api/store/transcribe", { method: "POST", body });
      setTranscript(result.text);
      setAudioUrl(result.audioUrl);
      if (result.job) setJob(result.job);
      if (result.likes) setLikes(result.likes);
      if (result.colors) setColors(result.colors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao transcrever o áudio");
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        transcribeBlob(blob, "briefing.webm");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Não foi possível usar o microfone. Verifique as permissões do navegador.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const typed = job.trim() && likes.trim() && colors.trim();
    if (!typed && !transcript.trim()) {
      setError("Escreva os três campos ou grave um áudio.");
      return;
    }
    onConfirm({
      job: job.trim(),
      likes: likes.trim(),
      colors: colors.trim(),
      transcript: transcript.trim(),
      audioUrl,
    });
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onCancel} />
      <aside className="drawer personalize-drawer" aria-label="Personalizar PRANKID">
        <div className="card-row">
          <h2>Seu PRANKID</h2>
          <button className="btn ghost" type="button" onClick={onCancel}>
            Fechar
          </button>
        </div>
        <p className="muted">
          Peça personalizada. Escreva ou grave um áudio para o Dan transferir a sua essência para o {product.name}.
        </p>
        <div className="form-grid" style={{ marginBottom: 16 }}>
          <p className="muted">Não quer digitar? Fale sobre o que você faz, do que gosta e as cores do seu PRANKID.</p>
          {recording ? (
            <div className="rec-meter" aria-live="polite">
              <span className="rec-dot" />
              <div className="rec-waves" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <strong>Gravando {formatElapsed(elapsed)}</strong>
            </div>
          ) : null}
          <div className="row-actions">
            {recording ? (
              <button className="btn magenta" type="button" onClick={stopRecording}>
                ENVIAR AUDIO
              </button>
            ) : (
              <button className="btn" type="button" onClick={startRecording} disabled={busy}>
                Gravar áudio
              </button>
            )}
          </div>
          {busy ? (
            <div className="rec-meter" style={{ background: "var(--bg-3)", borderColor: "var(--yellow)" }}>
              <div className="rec-waves" aria-hidden="true">
                <span style={{ background: "var(--cyan)" }} />
                <span style={{ background: "var(--cyan)" }} />
                <span style={{ background: "var(--cyan)" }} />
                <span style={{ background: "var(--cyan)" }} />
                <span style={{ background: "var(--cyan)" }} />
              </div>
              <strong>Transcrevendo e preenchendo os campos...</strong>
            </div>
          ) : null}
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            O que você faz?
            <textarea value={job} onChange={(e) => setJob(e.target.value)} placeholder="Trabalho, ofício, rotina..." />
          </label>
          <label>
            Do que você gosta?
            <textarea value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="Estilo, referências, manias, o que te representa..." />
          </label>
          <label>
            Quais cores você quer no seu PRANKID?
            <textarea value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Amarelo, preto, magenta..." />
          </label>
          {error ? <p className="cart-error">{error}</p> : null}
          <button className="btn full" type="submit" disabled={busy || recording}>
            Continuar a compra
          </button>
        </form>
      </aside>
    </>
  );
}
