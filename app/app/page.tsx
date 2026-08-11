"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Business = { id: string; name: string; industry: string | null };
type Agent = { id: string; name: string; status: string };

export default function AppPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadWorkspace() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.replace("/login");
        return;
      }
      setName(user.user_metadata.full_name || user.email?.split("@")[0] || "Hola");
      const { data: membership } = await supabase
        .from("business_members")
        .select("business_id, businesses(id, name, industry)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      const currentBusiness = membership?.businesses as unknown as Business | null;
      if (currentBusiness) {
        setBusiness(currentBusiness);
        const { data: currentAgent } = await supabase
          .from("agents")
          .select("id, name, status")
          .eq("business_id", currentBusiness.id)
          .eq("kind", "knowledge")
          .limit(1)
          .maybeSingle();
        setAgent(currentAgent);
      }
      setLoading(false);
    }
    loadWorkspace();
  }, []);

  async function createFerBeauty() {
    setCreating(true);
    setMessage("");
    const { data: createdBusiness, error } = await supabase.rpc("create_business_for_current_user", {
      business_name: "Fer Beauty",
      business_slug: "fer-beauty",
      business_industry: "Clínica estética",
    });
    if (error) {
      setMessage(error.message.includes("duplicate") ? "Este espacio ya existe. Actualiza la página." : error.message);
      setCreating(false);
      return;
    }
    const newBusiness = createdBusiness as Business;
    const { data: newAgent, error: agentError } = await supabase
      .from("agents")
      .insert({ business_id: newBusiness.id, name: "Asistente de Fer Beauty", kind: "knowledge", status: "draft" })
      .select("id, name, status")
      .single();
    if (agentError) setMessage(agentError.message);
    setBusiness(newBusiness);
    setAgent(newAgent);
    setCreating(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (loading) return <main className="app-loading">Preparando tu espacio…</main>;

  if (!business) {
    return (
      <main className="onboarding-page">
        <div className="onboarding-card">
          <Link className="brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></Link>
          <p className="eyebrow">Primer paso</p>
          <h1>Creemos el espacio de Fer Beauty.</h1>
          <p>Tu información, fuentes y futuros agentes quedarán aislados de los demás clientes.</p>
          <button className="button button-primary" onClick={createFerBeauty} disabled={creating}>
            {creating ? "Creando espacio…" : "Crear Fer Beauty"} <span>→</span>
          </button>
          {message && <p className="auth-note">{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <aside className="dash-sidebar">
        <Link className="brand dash-brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></Link>
        <p className="workspace">ESPACIO DE TRABAJO</p>
        <strong className="company">{business.name}<span>⌄</span></strong>
        <nav>
          <Link className="active" href="/app">▦ Resumen</Link>
          <Link href="/app/conocimiento">✦ Conocimiento</Link>
          <a href="#canales">◌ Canales</a>
        </nav>
        <div className="sidebar-help"><strong>Tu espacio está protegido</strong><p>Solo los miembros de {business.name} pueden ver este contenido.</p><Link href="/app/conocimiento">Agregar conocimiento →</Link></div>
      </aside>

      <section className="dash-content">
        <header>
          <div><p className="eyebrow">Tu espacio de trabajo</p><h1>Hola, {name} <span>✦</span></h1></div>
          <div className="user-card"><button className="profile" onClick={signOut} title="Cerrar sesión">{name.slice(0, 2).toUpperCase()}</button><span><strong>{name}</strong><small>Administrador · salir</small></span></div>
        </header>

        <div className="welcome">
          <div><span className="welcome-chip">FER BEAUTY</span><h2>Tu asistente está listo para aprender sobre tu clínica.</h2><p>Agrega contenido aprobado y después lo conectaremos con WhatsApp.</p></div><div className="welcome-dots">✦<br />↗</div>
        </div>

        <section className="progress-panel">
          <div><p className="eyebrow">Puesta en marcha</p><h2>Tu primer agente está al 50%</h2></div>
          <div className="progress-track"><span className="half" /></div>
          <div className="progress-labels"><span>Cuenta creada</span><span>Conocimiento</span><span>Canal</span><span>Activo</span></div>
        </section>

        <section>
          <div className="dash-section-head"><div><p className="eyebrow">Tu agente</p><h2>Equipo de IA</h2></div><Link className="soft-button" href="/app/conocimiento">Administrar contenido</Link></div>
          <div className="dash-cards one-card">
            <article className="agent-card">
              <div className="agent-card-top"><span className="dash-icon lime">✦</span><span className="status-draft">{agent?.status === "active" ? "ACTIVO" : "BORRADOR"}</span></div>
              <h3>{agent?.name || "Asistente de Fer Beauty"}</h3><p>Respuestas basadas solo en el conocimiento validado de la clínica.</p>
              <div className="agent-meta"><span>Conocimiento privado</span><span>WhatsApp pendiente</span></div><Link href="/app/conocimiento">Agregar fuentes →</Link>
            </article>
          </div>
        </section>

        <section className="next-steps">
          <p className="eyebrow">Siguiente paso recomendado</p><h2>Entrena el asistente de Fer Beauty</h2><p>Agrega procedimientos, cuidados posteriores, preguntas frecuentes y enlaces oficiales. Evita recomendaciones médicas personalizadas: el asistente derivará esos casos al equipo clínico.</p>
          <div className="setup-actions"><Link href="/app/conocimiento" className="button button-primary">Agregar conocimiento <span>→</span></Link></div>
        </section>
      </section>
    </main>
  );
}
