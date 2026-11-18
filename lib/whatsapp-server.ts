import { createClient, type User } from "@supabase/supabase-js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBusinessId(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function whatsappAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authorizedBusinessUser(request: Request, businessId: string): Promise<
  | { user: User; error?: never }
  | { user?: never; error: Response }
> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: Response.json({ error: "Inicia sesión." }, { status: 401 }) };
  if (!isBusinessId(businessId)) return { error: Response.json({ error: "Negocio inválido." }, { status: 400 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { error: Response.json({ error: "Servicio no disponible." }, { status: 503 }) };

  const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  if (authError || !user) return { error: Response.json({ error: "Sesión no válida." }, { status: 401 }) };
  const { data: member, error: memberError } = await client.from("business_members")
    .select("business_id").eq("business_id", businessId).eq("user_id", user.id).maybeSingle();
  if (memberError) return { error: Response.json({ error: "No pudimos verificar el acceso." }, { status: 503 }) };
  if (!member) return { error: Response.json({ error: "No tienes acceso a este negocio." }, { status: 403 }) };
  return { user };
}
