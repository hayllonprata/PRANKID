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

export async function fillBriefFromTranscript(apiKey: string, transcript: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você organiza briefings para um artista criar um PRANKID personalizado. Responda só JSON com as chaves job, likes e colors. job = o que a pessoa faz (trabalho, ofício, rotina). likes = do que gosta, estilo, referências. colors = cores que quer na peça. Se algo não foi dito, escreva uma síntese curta com o que dá para inferir, sem inventar biografia. Português do Brasil.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Não foi possível preencher os campos com o áudio");
  }

  let parsed: { job?: string; likes?: string; colors?: string } = {};
  try {
    parsed = JSON.parse(String(payload.choices?.[0]?.message?.content || "{}")) as typeof parsed;
  } catch {
    parsed = {};
  }

  return {
    job: String(parsed.job || "").trim(),
    likes: String(parsed.likes || "").trim(),
    colors: String(parsed.colors || "").trim(),
  };
}
