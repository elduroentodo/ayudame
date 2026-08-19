import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const instructions = "Eres el asistente de un negocio de Latinoamérica. Responde en español claro, breve y cercano, usando exclusivamente el conocimiento proporcionado. Adapta el lenguaje al país del negocio sin estereotipos. Si no aparece la respuesta, dilo y ofrece escalar al equipo humano. No inventes precios, horarios, políticas ni disponibilidad. No des diagnósticos, contraindicaciones o indicaciones médicas personalizadas; ante asuntos clínicos o de seguridad, pide contactar al profesional responsable.";

async function answerWithCloudflare(userPrompt: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_TOKEN;
  const model = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.2-3b-instruct";
  if (!accountId || !apiToken) throw new Error("missing_cloudflare_config");

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(model)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "system", content: instructions }, { role: "user", content: userPrompt }] }),
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json().catch(() => ({})) as { success?: boolean; errors?: { message?: string }[]; result?: { response?: string } };
  if (!response.ok || !data.success) throw new Error(data.errors?.[0]?.message || "cloudflare_error");
  return data.result?.response || "";
}

async function answerWithOllama(userPrompt: string) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen2.5:7b";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: false, messages: [{ role: "system", content: instructions }, { role: "user", content: userPrompt }] }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error("ollama_error");
  const data = await response.json() as { message?: { content?: string } };
  return data.message?.content || "";
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Debes iniciar sesión para probar el asistente." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });

  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 1200) return NextResponse.json({ error: "Escribe una pregunta de hasta 1.200 caracteres." }, { status: 400 });

  const { data: membership } = await supabase.from("business_members").select("business_id").eq("user_id", userData.user.id).limit(1).maybeSingle();
  if (!membership?.business_id) return NextResponse.json({ error: "No encontramos un espacio para tu cuenta." }, { status: 403 });

  const [{ data: business }, { data: articles }] = await Promise.all([
    supabase.from("businesses").select("name").eq("id", membership.business_id).maybeSingle(),
    supabase.from("knowledge_articles").select("title, body").eq("business_id", membership.business_id).eq("status", "published").limit(12),
  ]);
  const context = (articles || []).map((article) => `${article.title}\n${article.body}`).join("\n\n---\n\n").slice(0, 24000);
  if (!context) return NextResponse.json({ answer: "Aún no tengo información aprobada para responder. Te recomiendo contactar directamente al negocio." });

  const prompt = `Negocio: ${business?.name || "Tu negocio"}\n\nConocimiento aprobado:\n${context}\n\nPregunta del cliente: ${question}`;
  const provider = process.env.AI_PROVIDER || "cloudflare";
  try {
    const answer = provider === "ollama" ? await answerWithOllama(prompt) : await answerWithCloudflare(prompt);
    return NextResponse.json({ answer: answer || "No pude generar una respuesta en este momento." });
  } catch (error) {
    const missingConfig = error instanceof Error && error.message === "missing_cloudflare_config";
    return NextResponse.json({ error: missingConfig ? "Cloudflare Workers AI aún no está configurado." : "El asistente no pudo responder en este momento. Intenta nuevamente." }, { status: 503 });
  }
}