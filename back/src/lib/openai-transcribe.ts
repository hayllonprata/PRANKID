import fs from "node:fs";

export async function transcribeAudioFile(apiKey: string, filePath: string, filename: string, mime: string) {
  const bytes = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mime || "audio/webm" }), filename);
  form.append("model", "whisper-1");
  form.append("language", "pt");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const payload = (await response.json().catch(() => ({}))) as { text?: string; error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "A OpenAI não conseguiu transcrever o áudio");
  }
  const text = String(payload.text || "").trim();
  if (!text) {
    throw new Error("Não deu para entender o áudio. Tente gravar de novo.");
  }
  return text;
}
