import { createClient } from "@supabase/supabase-js";
import { authorizedBusinessUser, isBusinessId, whatsappAdminClient } from "@/lib/whatsapp-server";

export const runtime = "nodejs";

const phonePattern = /^\+?[0-9\s().-]{7,24}$/;

export async function POST(request: Request) {
  let body: { businessId?: unknown; whatsappNumber?: unknown; contactPhone?: unknown; note?: unknown };
  try { body = await request.json(); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid body"); }
  catch { return Response.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!isBusinessId(body.businessId)) return Response.json({ error: "Negocio inválido." }, { status: 400 });
  const access = await authorizedBusinessUser(request, body.businessId);
  if (access.error) return access.error;
  const whatsappNumber = typeof body.whatsappNumber === "string" ? body.whatsappNumber.trim() : "";
  const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!phonePattern.test(whatsappNumber) || !phonePattern.test(contactPhone) || note.length > 500) {
    return Response.json({ error: "Revisa los teléfonos y limita la nota a 500 caracteres." }, { status: 400 });
  }
  const admin = whatsappAdminClient();
  if (!admin) return Response.json({ error: "Servicio no disponible." }, { status: 503 });
  const { data: channel, error: channelError } = await admin.from("whatsapp_channels")
    .select("id").eq("business_id", body.businessId).maybeSingle();
  if (channelError) return Response.json({ error: "No pudimos revisar la conexión." }, { status: 503 });
  if (channel) return Response.json({ error: "Este negocio ya tiene una conexión." }, { status: 409 });
  const { data: existing, error: existingError } = await admin.from("whatsapp_setup_requests")
    .select("status").eq("business_id", body.businessId).maybeSingle();
  if (existingError) return Response.json({ error: "No pudimos revisar la solicitud." }, { status: 503 });
  if (existing?.status === "ready") return Response.json({ error: "La conexión ya está lista." }, { status: 409 });
  const { error } = await admin.from("whatsapp_setup_requests").upsert({
    business_id: body.businessId,
    requested_by: access.user.id,
    contact_email: access.user.email || "",
    contact_phone: contactPhone,
    whatsapp_number: whatsappNumber,
    note,
    status: existing?.status === "in_progress" ? "in_progress" : "pending",
    updated_at: new Date().toISOString(),
  }, { onConflict: "business_id" });
  if (error) return Response.json({ error: "No pudimos guardar la solicitud." }, { status: 503 });
  return Response.json({ status: existing?.status === "in_progress" ? "in_progress" : "pending" });
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Inicia sesión." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const admin = whatsappAdminClient();
  if (!url || !key || !admin) return Response.json({ error: "Servicio no disponible." }, { status: 503 });
  const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: userError } = await client.auth.getUser(token);
  if (userError || !user) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  const { data: role, error: roleError } = await client.from("user_roles")
    .select("role").eq("user_id", user.id).maybeSingle();
  if (roleError || role?.role !== "super_admin") return Response.json({ error: "Acceso restringido." }, { status: 403 });
  const { data: rows, error } = await admin.from("whatsapp_setup_requests")
    .select("business_id, contact_email, contact_phone, whatsapp_number, note, status, created_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: "No pudimos cargar las solicitudes." }, { status: 503 });
  const ids = (rows || []).map((row) => row.business_id);
  const { data: businesses, error: businessesError } = ids.length
    ? await admin.from("businesses").select("id, name").in("id", ids)
    : { data: [], error: null };
  if (businessesError) return Response.json({ error: "No pudimos cargar los negocios." }, { status: 503 });
  const names = new Map((businesses || []).map((business) => [business.id, business.name]));
  return Response.json({ requests: (rows || []).map((row) => ({ ...row, business_name: names.get(row.business_id) || "Negocio" })) });
}

export async function PATCH(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Inicia sesión." }, { status: 401 });
  let body: { businessId?: unknown; status?: unknown };
  try { body = await request.json(); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid body"); }
  catch { return Response.json({ error: "Solicitud inválida." }, { status: 400 }); }
  if (!isBusinessId(body.businessId) || (body.status !== "pending" && body.status !== "in_progress")) {
    return Response.json({ error: "Datos inválidos." }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const admin = whatsappAdminClient();
  if (!url || !key || !admin) return Response.json({ error: "Servicio no disponible." }, { status: 503 });
  const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: userError } = await client.auth.getUser(token);
  if (userError || !user) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  const { data: role, error: roleError } = await client.from("user_roles")
    .select("role").eq("user_id", user.id).maybeSingle();
  if (roleError || role?.role !== "super_admin") return Response.json({ error: "Acceso restringido." }, { status: 403 });
  const { data: row, error } = await admin.from("whatsapp_setup_requests")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("business_id", body.businessId).select("business_id").maybeSingle();
  if (error) return Response.json({ error: "No pudimos actualizar la solicitud." }, { status: 503 });
  if (!row) return Response.json({ error: "Solicitud no encontrada." }, { status: 404 });
  return Response.json({ status: body.status });
}
