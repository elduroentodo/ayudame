import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Inicia sesión." }, { status: 401 });
  const businessId = new URL(request.url).searchParams.get("businessId") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId)) {
    return Response.json({ error: "Negocio inválido." }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });

  const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  const { data: member, error: memberError } = await userClient.from("business_members")
    .select("business_id").eq("business_id", businessId).eq("user_id", userData.user.id).maybeSingle();
  if (memberError) return Response.json({ error: "No pudimos verificar el acceso." }, { status: 503 });
  if (!member) return Response.json({ error: "No tienes acceso a este negocio." }, { status: 403 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return Response.json({ connected: false, enabled: false, setupRequired: true });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: channel, error } = await admin.from("whatsapp_channels")
    .select("display_phone_number, enabled").eq("business_id", businessId).maybeSingle();
  if (error) return Response.json({ error: "No pudimos consultar el canal." }, { status: 503 });
  return Response.json({
    connected: Boolean(channel),
    enabled: Boolean(channel?.enabled),
    displayPhoneNumber: channel?.display_phone_number || null,
    setupRequired: !channel,
  });
}
