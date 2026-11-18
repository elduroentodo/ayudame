import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateKnowledgeReply, type KnowledgeArticle } from "@/lib/knowledge-answer";

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
  const businessId = typeof body.businessId === "string" ? body.businessId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId)) return NextResponse.json({ error: "Selecciona un negocio válido." }, { status: 400 });

  const { data: membership, error: membershipError } = await supabase.from("business_members").select("business_id").eq("user_id", userData.user.id).eq("business_id", businessId).maybeSingle();
  if (membershipError) return NextResponse.json({ error: "No pudimos verificar tu acceso al negocio." }, { status: 503 });
  if (!membership) return NextResponse.json({ error: "No tienes acceso a este negocio." }, { status: 403 });

  const [{ data: business, error: businessError }, { data: articles, error: articlesError }] = await Promise.all([
    supabase.from("businesses").select("name").eq("id", businessId).maybeSingle(),
    supabase.from("knowledge_articles").select("title, body").eq("business_id", businessId).eq("status", "published").order("created_at", { ascending: false }).limit(100),
  ]);
  if (businessError || articlesError || !business) return NextResponse.json({ error: "No pudimos consultar el conocimiento de tu negocio." }, { status: 503 });
  try {
    const answer = await generateKnowledgeReply(question, business.name, (articles || []) as KnowledgeArticle[]);
    return NextResponse.json({ answer });
  } catch (error) {
    const missingConfig = error instanceof Error && error.message === "missing_cloudflare_config";
    return NextResponse.json({ error: missingConfig ? "Cloudflare Workers AI aún no está configurado." : "El asistente no pudo responder en este momento. Intenta nuevamente." }, { status: 503 });
  }
}