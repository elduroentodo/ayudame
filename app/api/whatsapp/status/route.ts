import { authorizedBusinessUser, whatsappAdminClient } from "@/lib/whatsapp-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const businessId = new URL(request.url).searchParams.get("businessId") || "";
  const access = await authorizedBusinessUser(request, businessId);
  if (access.error) return access.error;
  const admin = whatsappAdminClient();
  if (!admin) return Response.json({ error: "Servicio no disponible." }, { status: 503 });
  const [{ data: channel, error }, { data: setupRequest, error: requestError }] = await Promise.all([
    admin.from("whatsapp_channels").select("display_phone_number, enabled").eq("business_id", businessId).maybeSingle(),
    admin.from("whatsapp_setup_requests").select("status").eq("business_id", businessId).maybeSingle(),
  ]);
  if (error || requestError) return Response.json({ error: "No pudimos consultar el canal." }, { status: 503 });
  return Response.json({
    connected: Boolean(channel),
    enabled: Boolean(channel?.enabled),
    displayPhoneNumber: channel?.display_phone_number || null,
    setupRequired: !channel,
    requestStatus: setupRequest?.status || null,
  });
}
