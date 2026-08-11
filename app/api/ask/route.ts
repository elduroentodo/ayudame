import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "La IA aún no está configurada." }, { status: 503 });
  const body = await request.json();
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const businessName = typeof body.businessName === "string" ? body.businessName : "";
  const context = Array.isArray(body.context) ? body.context.filter(Boolean).slice(0, 12).join("\n\n---\n\n").slice(0, 24000) : "";
  if (!question || !businessName) return NextResponse.json({ error: "Solicitud incompleta." }, { status: 400 });
  if (!context) return NextResponse.json({ answer: "Aún no tengo información aprobada para responder. Te recomiendo contactar directamente al negocio." });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini",
    store: false,
    instructions: "Eres el asistente de un negocio de Latinoamérica. Responde en español claro y breve. Usa exclusivamente el conocimiento proporcionado. Si no aparece la respuesta, dilo y ofrece escalar al equipo humano. No inventes precios, horarios, políticas ni disponibilidad. No des diagnósticos, contraindicaciones o indicaciones médicas personalizadas; ante asuntos clínicos o de seguridad, pide contactar al profesional responsable.",
    input: "Negocio: " + businessName + "\n\nConocimiento aprobado:\n" + context + "\n\nPregunta del cliente: " + question,
  });
  return NextResponse.json({ answer: response.output_text || "No pude generar una respuesta en este momento." });
}
