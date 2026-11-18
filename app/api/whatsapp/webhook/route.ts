import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { generateKnowledgeReply, type KnowledgeArticle } from "@/lib/knowledge-answer";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingText = { id: string; from: string; type: string; text?: { body?: string } };
type ChangeValue = { metadata?: { phone_number_id?: string }; messages?: IncomingText[] };
type WebhookPayload = { object?: string; entry?: { changes?: { field?: string; value?: ChangeValue }[] }[] };

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing_supabase_admin_config");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token) return new Response("Webhook not configured", { status: 503 });
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const supplied = url.searchParams.get("hub.verify_token");
  if (mode !== "subscribe" || !challenge || !supplied || !safeEqual(supplied, token)) {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function sendText(phoneNumberId: string, to: string, body: string, replyToId: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v27.0";
  if (!token || !/^v[0-9]+\.[0-9]+$/.test(version)) throw new Error("missing_whatsapp_send_config");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      context: { message_id: replyToId },
      text: { preview_url: false, body: body.slice(0, 4000) },
    }),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => ({})) as { messages?: { id?: string }[] };
  if (!response.ok || !result.messages?.[0]?.id) throw new Error("whatsapp_send_failed");
  return result.messages[0].id as string;
}

async function handleText(phoneNumberId: string, message: IncomingText) {
  const db = adminClient();
  const { data: channel, error: channelError } = await db.from("whatsapp_channels")
    .select("id, business_id, enabled").eq("phone_number_id", phoneNumberId).maybeSingle();
  if (channelError) throw new Error("channel_lookup_failed");
  if (!channel?.enabled) return;

  const { error: claimError } = await db.from("whatsapp_webhook_events").insert({
    wa_message_id: message.id, channel_id: channel.id, business_id: channel.business_id, status: "processing",
  });
  if (claimError?.code === "23505") {
    const { data: existing, error: lookupError } = await db.from("whatsapp_webhook_events")
      .select("status, updated_at").eq("wa_message_id", message.id).single();
    if (lookupError || !existing) throw new Error("event_lookup_failed");
    if (existing.status === "sent") return;
    if (existing.status === "processing" && Date.now() - Date.parse(existing.updated_at) < 55_000) {
      throw new Error("event_already_processing");
    }
    const { data: retry, error: retryError } = await db.from("whatsapp_webhook_events")
      .update({ status: "processing", error_code: null, updated_at: new Date().toISOString() })
      .eq("wa_message_id", message.id)
      .eq("status", existing.status)
      .eq("updated_at", existing.updated_at)
      .select("wa_message_id").maybeSingle();
    if (retryError || !retry) throw new Error("event_already_processing");
  } else if (claimError) {
    throw new Error("event_claim_failed");
  }

  try {
    const [{ data: business, error: businessError }, { data: articles, error: articlesError }] = await Promise.all([
      db.from("businesses").select("name").eq("id", channel.business_id).single(),
      db.from("knowledge_articles").select("title, body").eq("business_id", channel.business_id)
        .eq("status", "published").order("created_at", { ascending: false }).limit(100),
    ]);
    if (businessError || articlesError || !business) throw new Error("knowledge_lookup_failed");

    const question = message.text?.body?.trim() || "";
    let answer: string;
    if (question.length > 1200) {
      answer = "¿Puedes enviarme tu pregunta en un mensaje más corto? Así podré ayudarte mejor.";
    } else {
      try {
        answer = await generateKnowledgeReply(question, business.name, (articles || []) as KnowledgeArticle[]);
      } catch {
        answer = "No pude responder en este momento. Por favor, contacta directamente al equipo del negocio.";
      }
    }
    const outboundId = await sendText(phoneNumberId, message.from, answer, message.id);
    await db.from("whatsapp_webhook_events").update({
      status: "sent", outbound_message_id: outboundId, updated_at: new Date().toISOString(),
    }).eq("wa_message_id", message.id);
  } catch {
    await db.from("whatsapp_webhook_events").update({
      status: "failed", error_code: "processing_failed", updated_at: new Date().toISOString(),
    }).eq("wa_message_id", message.id);
    throw new Error("whatsapp_processing_failed");
  }
}

export async function POST(request: Request) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !process.env.WHATSAPP_VERIFY_TOKEN || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.WHATSAPP_ACCESS_TOKEN) {
    return new Response("Webhook not configured", { status: 503 });
  }
  const raw = await request.text();
  if (raw.length > 1024 * 1024) return new Response("Payload too large", { status: 413 });
  const signature = request.headers.get("x-hub-signature-256");
  const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  if (!signature || !safeEqual(signature, expected)) return new Response("Invalid signature", { status: 401 });

  let payload: WebhookPayload;
  try { payload = JSON.parse(raw) as WebhookPayload; }
  catch { return new Response("Invalid JSON", { status: 400 }); }
  if (payload.object !== "whatsapp_business_account") return Response.json({ received: true });

  const incoming: { phoneNumberId: string; message: IncomingText }[] = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;
      const phoneNumberId = change.value?.metadata?.phone_number_id || "";
      if (!/^[0-9]+$/.test(phoneNumberId)) continue;
      for (const message of change.value?.messages || []) {
        if (message.type === "text" && message.id && message.from && message.text?.body?.trim()) {
          incoming.push({ phoneNumberId, message });
        }
      }
    }
  }
  if (incoming.length) {
    const outcomes = await Promise.allSettled(incoming.map(({ phoneNumberId, message }) => handleText(phoneNumberId, message)));
    if (outcomes.some((result) => result.status === "rejected")) {
      console.error("WhatsApp webhook processing failed");
      return new Response("Processing failed; retry delivery", { status: 503 });
    }
  }
  return Response.json({ received: true });
}
