import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const instructions = "Eres el asistente de un negocio de Latinoamérica. Responde en español claro, breve y cercano, usando exclusivamente el conocimiento proporcionado. Adapta el lenguaje al país del negocio sin estereotipos. Si no aparece la respuesta, dilo y ofrece escalar al equipo humano. No inventes precios, horarios, políticas ni disponibilidad. No des diagnósticos, contraindicaciones o indicaciones médicas personalizadas; ante asuntos clínicos o de seguridad, pide contactar al profesional responsable.";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Debes iniciar sesión para probar el asistente." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });

  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });

  const question = typeof (await request.json()).question === "string" ? (await request.clone().json().catch(() => ({}))).question?.trim() : "";
  if (!question || question.length > 1200) return NextResponse.json({ error: "Escribe una pregunta de hasta 1.200 caracteres." }, { status: 400 });

  const { data: membership } = await supabase.from("business_members").select("business_id").eq("user_id", userData.user.id).limit(1).maybeSingle();
  if (!membership?.business_id) return NextResponse.json({ error: "No encontramos un espacio para tu cuenta." }, { status: 403 });

  const [{ data: business }, { data: articles }] = await Promise.all([
    supabase.from("businesses").select("name").eq("id", membership.business_id).maybeSingle(),
    supabase.from("knowledge_articles").select("title, body").eq("business_id", membership.business_id).eq("status", "published").limit(12),
  ]);
  const context = (articles || []).map((article) => `${article.title}\n${article.body}`).join("\n\n---\n\n").slice(0, 24000);
  if (!context) return NextResponse.json({ answer: "Aún no tengo información aprobada para responder. Te recomiendo contactar directamente al negocio." });

  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "qwen2.5:7b";
  try {
    const ollama = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, stream: false, messages: [
        { role: "system", content: instructions },
        { role: "user", content: `Negocio: ${business?.name || "Tu negocio"}\n\nConocimiento aprobado:\n${context}\n\nPregunta del cliente: ${question}` },
      ] }),
      signal: AbortSignal.timeout(45000),
    });
    if (!ollama.ok) throw new Error(`Ollama respondió ${ollama.status}`);
    const data = await ollama.json() as { message?: { content?: string } };
    return NextResponse.json({ answer: data.message?.content || "No pude generar una respuesta en este momento." });
  } catch {
    return NextResponse.json({ error: "No logramos conectar con Ollama. En desarrollo inicia Ollama y ejecuta: ollama pull qwen2.5:7b. En Vercel configura un proveedor remoto compatible." }, { status: 503 });
  }
}