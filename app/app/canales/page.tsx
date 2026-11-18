"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { listBusinessIds, preferredBusinessId } from "@/lib/workspace";

type ChannelStatus = { connected: boolean; enabled: boolean; displayPhoneNumber: string | null; setupRequired: boolean; requestStatus: "pending" | "in_progress" | "ready" | null };
type Business = { id: string; name: string };

export default function ChannelsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) { window.location.replace("/login"); return; }
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError || new Error("session_invalid");
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

  useEffect(() => { void load(); }, []);

  async function requestConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business || sending) return;
    setSending(true);
    setNotice("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.replace("/login"); return; }
      const response = await fetch("/api/whatsapp/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessId: business.id, whatsappNumber, contactPhone, note }),
      });
      const result = await response.json() as { status?: ChannelStatus["requestStatus"]; error?: string };
      if (!response.ok) throw new Error(result.error || "No pudimos guardar tu solicitud.");
      setStatus((current) => current ? { ...current, requestStatus: result.status || "pending" } : current);
      setNotice("Recibimos tu solicitud. Te contactaremos para acompañarte con la conexión.");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "No pudimos guardar tu solicitud.");
    } finally {
      setSending(false);
    }
  }
  if (loading) return <main className="app-loading">Cargando canal…</main>;
  if (error) return <main className="auth-page"><section className="auth-card"><p className="eyebrow">WhatsApp</p><h1>Estado no disponible</h1><p className="auth-copy">{error}</p><button className="button button-primary" onClick={load}>Reintentar</button><Link className="back-link" href="/app">Volver al resumen</Link></section></main>;
  if (!business || !status) return null;

  const requestPending = status.requestStatus === "pending" || status.requestStatus === "in_progress";
  return <main className="knowledge-page">
    <header className="knowledge-nav"><Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link><div><span className="business-pill">{business.name}</span><Link className="back-link" href="/app">Volver al resumen</Link></div></header>
    <section className="knowledge-shell channel-shell">
      <div className="knowledge-heading"><div><p className="eyebrow">Canales · {business.name}</p><h1>WhatsApp, sin vueltas.</h1><p>Nosotros preparamos la integración. Tú conservas tu número y autorizas la conexión directamente con Meta.</p></div><span className="channel-badge">Sin crear una app de Meta</span></div>
      <div className="channel-steps" aria-label="Pasos para conectar WhatsApp">
        <div><span>01</span><strong>Cuéntanos tu número</strong><p>Indica el WhatsApp que usa tu negocio y dónde podemos contactarte.</p></div>
        <div><span>02</span><strong>Confirma que es tuyo</strong><p>Te acompañamos para autorizar Ayúdame y verificar el número en Meta.</p></div>
        <div><span>03</span><strong>Probamos contigo</strong><p>Las respuestas automáticas quedan apagadas hasta que las revisemos juntos.</p></div>
      </div>
      <div className="knowledge-layout channel-layout">
        <section className="channel-card">
          <p className="eyebrow">Tu conexión</p>
          <h2>{status.enabled ? "WhatsApp activo" : status.connected ? "Número conectado, pendiente de activación" : requestPending ? "Estamos preparando tu conexión" : "Empecemos por tu número"}</h2>
          {status.connected ? <><p className="channel-copy">{status.displayPhoneNumber ? `Número conectado: ${status.displayPhoneNumber}.` : "Tu número ya está conectado."} {status.enabled ? "El asistente puede responder mensajes entrantes." : "Todavía no enviará respuestas automáticas."}</p><Link className="button button-primary" href="/app/conocimiento">Revisar conocimiento</Link></> : requestPending ? <><p className="channel-copy">Ya recibimos tu solicitud{status.requestStatus === "in_progress" ? " y la estamos trabajando" : ""}. Te contactaremos para completar la autorización y hacer una prueba. No necesitas compartir contraseñas ni tokens.</p><p className="channel-contact">¿Cambió tu número? Escríbenos a <a href="mailto:sebastian.espindola.h@gmail.com?subject=Ayudame%20-%20cambio%20de%20numero%20de%20WhatsApp">soporte de Ayúdame</a>.</p></> : <form className="channel-form" onSubmit={requestConnection}>
            <p>Solo necesitamos dos teléfonos. El dueño del número confirmará la conexión en Meta cuando llegue el momento.</p>
            <label>WhatsApp del negocio<input type="tel" inputMode="tel" autoComplete="tel" required minLength={7} maxLength={24} value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="Ej. +57 300 123 4567" /></label>
            <label>Teléfono para contactarte<input type="tel" inputMode="tel" autoComplete="tel" required minLength={7} maxLength={24} value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="Puede ser el mismo número" /></label>
            <label>Algo que debamos saber <span>(opcional)</span><textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Por ejemplo, si ya usas la app WhatsApp Business." /></label>
            <button className="button button-primary" disabled={sending}>{sending ? "Enviando solicitud…" : "Pedir conexión guiada"}</button>
            <small>No pedimos contraseñas, códigos ni acceso a tu cuenta por chat.</small>
          </form>}
          {notice && <p className="channel-notice" role="status">{notice}</p>}
        </section>
        <aside className="knowledge-help channel-help"><span className="dash-icon lime">✦</span><h2>Antes de activarlo</h2><p>El asistente responde con la información que tú apruebes. Agrega servicios, horarios y preguntas frecuentes para que la prueba sea útil.</p><Link className="channel-help-link" href="/app/conocimiento">Preparar conocimiento</Link><div className="channel-help-divider" /><h3>Conexión en un paso</h3><p>Estamos completando la aprobación de Meta para ofrecer conexión directa desde Ayúdame. La conexión guiada ya está disponible.</p></aside>
      </div>
    </section>
  </main>;
}
