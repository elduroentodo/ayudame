"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { listBusinessIds, preferredBusinessId } from "@/lib/workspace";

type ChannelStatus = { connected: boolean; enabled: boolean; displayPhoneNumber: string | null; setupRequired: boolean };
type Business = { id: string; name: string };

export default function ChannelsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { window.location.replace("/login"); return; }
      const businessId = preferredBusinessId(user.id, await listBusinessIds(user.id));
      if (!businessId) { window.location.replace("/app"); return; }
      const { data: currentBusiness, error: businessError } = await supabase.from("businesses")
        .select("id, name").eq("id", businessId).single();
      if (businessError || !currentBusiness) throw businessError || new Error("business_missing");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("session_missing");
      const response = await fetch(`/api/whatsapp/status?businessId=${encodeURIComponent(businessId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error("status_unavailable");
      setBusiness(currentBusiness);
      setStatus(await response.json() as ChannelStatus);
    } catch {
      setError("No pudimos consultar el estado de WhatsApp. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  if (loading) return <main className="app-loading">Cargando canal…</main>;
  if (error) return <main className="auth-page"><section className="auth-card"><p className="eyebrow">WhatsApp</p><h1>Estado no disponible</h1><p className="auth-copy">{error}</p><button className="button button-primary" onClick={load}>Reintentar →</button><Link className="back-link" href="/app">Volver al resumen</Link></section></main>;
  if (!business || !status) return null;

  return <main className="knowledge-page">
    <header className="knowledge-nav"><Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link><div><span className="business-pill">{business.name}</span><Link className="back-link" href="/app">← Volver al resumen</Link></div></header>
    <section className="knowledge-shell">
      <div className="knowledge-heading"><div><p className="eyebrow">Canales · {business.name}</p><h1>WhatsApp</h1><p>Conecta un número de WhatsApp Business para que el asistente responda preguntas entrantes con los artículos aprobados de este negocio.</p></div></div>
      <div className="knowledge-layout">
        <section className="next-steps">
          <p className="eyebrow">Estado de la conexión</p>
          <h2>{status.enabled ? "Canal activo" : status.connected ? "Número vinculado, aún sin activar" : "Aún no hay un número vinculado"}</h2>
          <p>{status.displayPhoneNumber ? `Número: ${status.displayPhoneNumber}` : "Tu número de WhatsApp no ha sido configurado todavía."}</p>
          <p>Por seguridad, la vinculación y activación se hacen después de verificar la propiedad del número. No compartas tokens ni secretos en el chat ni en formularios públicos.</p>
          <Link className="button button-primary" href="/app/conocimiento">Revisar conocimiento <span>→</span></Link>
        </section>
        <aside className="knowledge-help"><span className="dash-icon lime">✦</span><h2>Cómo lo activamos</h2><ul><li>Publica al menos un artículo con información aprobada.</li><li>Prepara una app de Meta con WhatsApp Business y un número de prueba o real.</li><li>Verificamos el webhook y probamos una conversación antes de activar respuestas automáticas.</li></ul><p>En esta primera versión respondemos mensajes de texto iniciados por el cliente. PDFs, audios, imágenes y mensajes proactivos no están habilitados.</p></aside>
      </div>
    </section>
  </main>;
}
