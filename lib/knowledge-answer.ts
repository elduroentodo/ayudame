export type KnowledgeArticle = { title: string; body: string };

const instructions = "Eres el asistente de un negocio de Latinoamérica. Responde en español claro, breve y cercano, usando exclusivamente el conocimiento proporcionado. Adapta el lenguaje al país del negocio sin estereotipos. Si no aparece la respuesta, dilo y ofrece escalar al equipo humano. No inventes precios, horarios, políticas ni disponibilidad. No des diagnósticos, contraindicaciones o indicaciones médicas personalizadas; ante asuntos clínicos o de seguridad, pide contactar al profesional responsable.";

function terms(value: string) {
  const stop = new Set(["para", "como", "donde", "cuando", "cuanto", "cual", "que", "con", "del", "las", "los", "una", "uno", "por", "hay", "tienen", "puedo", "quiero"]);
  return [...new Set(value.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").match(/[a-z0-9]{3,}/g) || [])]
    .filter((term) => !stop.has(term));
}

function relevantContext(question: string, articles: KnowledgeArticle[]) {
  const query = terms(question);
  const ranked = articles.map((article, index) => {
    const title = article.title.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const body = article.body.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const score = query.reduce((total, term) => total + (title.includes(term) ? 4 : 0) + (body.includes(term) ? 1 : 0), 0);
    return { article, score, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
  let remaining = 10000;
  const selected: string[] = [];
  for (const { article } of ranked.slice(0, 6)) {
    const item = `${article.title}\\n${article.body}`.slice(0, Math.min(3500, remaining));
    if (!item.trim()) continue;
    selected.push(item);
    remaining -= item.length;
    if (remaining < 200) break;
  }
  return selected.join("\\n\\n---\\n\\n");
}

async function answerWithCloudflare(userPrompt: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_TOKEN;
  const model = process.env.CLOUDFLARE_AI_MODEL || "@cf/zai-org/glm-4.7-flash";
  if (!accountId || !apiToken) throw new Error("missing_cloudflare_config");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURI(model)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "system", content: instructions }, { role: "user", content: userPrompt }], max_completion_tokens: 350 }),
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json().catch(() => ({})) as { success?: boolean; errors?: { message?: string }[]; result?: { response?: string; choices?: { message?: { content?: string } }[] } };
  if (!response.ok || !data.success) throw new Error(data.errors?.[0]?.message || "cloudflare_error");
  const answer = data.result?.response || data.result?.choices?.[0]?.message?.content;
  if (!answer) throw new Error("cloudflare_empty_response");
  return answer;
}

async function answerWithOllama(userPrompt: string) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\\/$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen2.5:7b";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: false, messages: [{ role: "system", content: instructions }, { role: "user", content: userPrompt }] }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error("ollama_error");
  const data = await response.json() as { message?: { content?: string } };
  if (!data.message?.content) throw new Error("ollama_empty_response");
  return data.message.content;
}

export async function generateKnowledgeReply(question: string, businessName: string, articles: KnowledgeArticle[]) {
  const context = relevantContext(question, articles);
  if (!context) return "Aún no tengo información aprobada para responder. Te recomiendo contactar directamente al negocio.";
  const prompt = `Negocio: ${businessName}\\n\\nConocimiento aprobado:\\n${context}\\n\\nPregunta del cliente: ${question}`;
  return process.env.AI_PROVIDER === "ollama" ? answerWithOllama(prompt) : answerWithCloudflare(prompt);
}
