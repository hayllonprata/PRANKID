"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, type Settings } from "@/lib/api";

export default function ConfigPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<Settings>("/api/admin/settings").then(setSettings).catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setMsg("");
    setError("");
    try {
      const saved = await api<Settings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(saved);
      setMsg("Configurações salvas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    }
  }

  if (!settings) return <p>Carregando...</p>;

  return (
    <>
      <h1>Configurações</h1>
      <form className="panel-card form-grid" onSubmit={onSubmit}>
        <label>
          WhatsApp (DDD + número)
          <input
            value={settings.whatsapp}
            onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
            placeholder="11999999999"
          />
        </label>
        <label>
          URL base do checkout Yampi
          <input
            value={settings.yampiBaseUrl}
            onChange={(e) => setSettings({ ...settings, yampiBaseUrl: e.target.value })}
            placeholder="https://seguro.seudominio.com.br"
          />
        </label>
        <label>
          Cupom Yampi (15% off)
          <input
            value={settings.yampiPromocode || ""}
            onChange={(e) => setSettings({ ...settings, yampiPromocode: e.target.value })}
            placeholder="PRANKID15"
          />
        </label>
        <p className="muted">
          Crie o cupom de 15% em Marketing → Cupons na Yampi e cole o código aqui. O checkout recebe
          <code> ?promocode= </code>
          no link de compra, então o desconto também vale se o cliente incluir mais produtos lá.
        </p>
        <label>
          Instagram
          <input
            value={settings.instagram}
            onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
            placeholder="@prankid_world"
          />
        </label>
        <label>
          Chave API da OpenAI
          <input
            type="password"
            autoComplete="off"
            value={settings.openaiApiKey || ""}
            onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
            placeholder={settings.hasOpenaiKey ? "Chave já salva. Cole outra só se quiser trocar." : "sk-..."}
          />
        </label>
        <p className="muted">Usada para transcrever o áudio do briefing personalizado (Whisper).</p>
        <label>
          Texto do rodapé
          <textarea value={settings.footer} onChange={(e) => setSettings({ ...settings, footer: e.target.value })} />
        </label>
        <p className="cart-note">
          O token de cada produto vem do link de compra da Yampi: copie o final de
          <code> /r/TOKEN </code>
          e cole no cadastro do produto.
        </p>
        {msg ? <p className="msg ok">{msg}</p> : null}
        {error ? <p className="msg err">{error}</p> : null}
        <button className="btn" type="submit">
          Salvar
        </button>
      </form>
    </>
  );
}
