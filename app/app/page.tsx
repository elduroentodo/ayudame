"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Business = { id: string; name: string; description: string | null; website: string | null; industry: string | null };
type Agent = { id: string; name: string; status: string };

function safeSlug(value: string) {
  return `${value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
}

export default function AppPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ businessName: "", administratorName: "", administratorPhone: "", businessAddress: "", businessPhone: "", industry: "", description: "", website: "", about: "" });
  const [firstPdf, setFirstPdf] = useState<File | null>(null);

  async function loadWorkspace() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    setName(user.user_metadata.full_name || user.email?.split("@")[0] || "Hola");
    const { data: membership } = await supabase.from("business_members").select("business_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (membership?.business_id) {
      const { data: currentBusiness } = await supabase.from("businesses").select("id, name, description, website, industry").eq("id", membership.business_id).maybeSingle();
      if (currentBusiness) {
        setBusiness(currentBusiness);
        const { data: currentAgent } = await supabase.from("agents").select("id, name, status").eq("business_id", currentBusiness.id).eq("kind", "knowledge").limit(1).maybeSingle();
        setAgent(currentAgent);
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadWorkspace(); }, []);

  function updateForm(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createWorkspace(event: FormEvent) {
    event.preventDefault();
    if (!form.about.trim() && !firstPdf) { setMessage("Describe tu negocio o adjunta un PDF para empezar."); return; }
    setCreating(true); setMessage("");
    const { data: createdBusiness, error } = await supabase.rpc("create_business_for_current_user", {
      business_name: form.businessName,
      business_slug: safeSlug(form.businessName),
      business_industry: form.industry || null,
      administrator_name: form.administratorName,
      administrator_phone: form.administratorPhone,
      business_address: form.businessAddress,
      business_phone: form.businessPhone,
      business_description: form.description,
      business_website: form.website,
    });
    if (error || !createdBusiness) { setMessage(error?.message || "No pudimos crear el espacio."); setCreating(false); return; }
    const newBusiness = createdBusiness as Business;
    const { data: { user } } = await supabase.auth.getUser();
    if (form.about.trim()) {
      const { error: articleError } = await supabase.from("knowledge_articles").insert({ business_id: newBusiness.id, title: `Información inicial de ${newBusiness.name}`, body: form.about.trim(), status: "published", created_by: user?.id });
      if (articleError) { setMessage(articleError.message); setCreating(false); return; }
    }
    if (firstPdf) {
      const path = `${newBusiness.id}/${Date.now()}-${firstPdf.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("knowledge-files").upload(path, firstPdf, { upsert: false });
      if (uploadError) { setMessage(`El espacio se creó, pero no pudimos subir el PDF: ${uploadError.message}`); setBusiness(newBusiness); setCreating(false); return; }
      const { error: documentError } = await supabase.from("knowledge_documents").insert({ business_id: newBusiness.id, file_name: firstPdf.name, storage_path: path, mime_type: firstPdf.type || "application/pdf", size_bytes: firstPdf.size, status: "ready" });
      if (documentError) { setMessage(documentError.message); setBusiness(newBusiness); setCreating(false); return; }
    }
    setBusiness(newBusiness); setCreating(false);
  }

  async function signOut() { await supabase.auth.signOut(); window.location.assign("/"); }

  if (loading) return <main className="app-loading">Preparando tu espacio…</main>;

  if (!business) return <main className="onboarding-page"><form className="onboarding-card onboarding-form" onSubmit={createWorkspace}>
    <Link className="brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></Link>
    <p className="eyebrow">Crea tu espacio</p><h1>Cuéntanos sobre tu negocio.</h1><p>Esta información será privada y configura la base de tu primer agente.</p>
    <div className="form-grid"><label>Nombre del negocio<input name="businessName" value={form.businessName} onChange={updateForm} required placeholder="Ej. Clínica Aurora" /></label><label>Sector o industria<input name="industry" value={form.industry} onChange={updateForm} placeholder="Ej. Estética" /></label><label>Nombre del administrador<input name="administratorName" value={form.administratorName} onChange={updateForm} required placeholder="Tu nombre" /></label><label>Teléfono del administrador<input name="administratorPhone" value={form.administratorPhone} onChange={updateForm} required placeholder="+57…" /></label><label>Dirección del negocio<input name="businessAddress" value={form.businessAddress} onChange={updateForm} required placeholder="Calle, ciudad" /></label><label>Teléfono del negocio<input name="businessPhone" value={form.businessPhone} onChange={updateForm} required placeholder="+57…" /></label></div>
    <label>¿De qué se trata tu negocio?<textarea name="description" value={form.description} onChange={updateForm} required placeholder="Una reseña breve para configurar tu espacio." /></label>
    <label>Sitio web o URL relevante<input name="website" type="url" value={form.website} onChange={updateForm} placeholder="https://…" /></label>
    <section className="first-content"><p className="eyebrow">Primer conocimiento</p><h2>Agrega información inicial de tu negocio</h2><label>Describe tu negocio <span>(o sube un PDF)</span><textarea name="about" value={form.about} onChange={updateForm} placeholder="Qué hacen, a quién atienden, servicios, horarios y preguntas frecuentes…" /></label><label>Primer PDF <span>(opcional)</span><input type="file" accept="application/pdf" onChange={(event) => setFirstPdf(event.target.files?.[0] || null)} /></label></section>
    {message && <p className="auth-note">{message}</p>}<button className="button button-primary" disabled={creating}>{creating ? "Creando espacio…" : "Crear mi plataforma"} <span>→</span></button>
  </form></main>;

  return <main className="dashboard"><aside className="dash-sidebar"><Link className="brand dash-brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></Link><p className="workspace">ESPACIO DE TRABAJO</p><strong className="company">{business.name}<span>⌄</span></strong><nav><Link className="active" href="/app">▦ Resumen</Link><Link href="/app/conocimiento">✦ Conocimiento</Link><a href="#canales">◌ Canales</a></nav><div className="sidebar-help"><strong>Tu espacio está protegido</strong><p>Solo los miembros de {business.name} pueden ver este contenido.</p><Link href="/app/conocimiento">Agregar conocimiento →</Link></div></aside><section className="dash-content"><header><div><p className="eyebrow">Tu espacio de trabajo</p><h1>Hola, {name} <span>✦</span></h1></div><div className="user-card"><button className="profile" onClick={signOut} title="Cerrar sesión">{name.slice(0, 2).toUpperCase()}</button><span><strong>{name}</strong><small>Administrador · salir</small></span></div></header><div className="welcome"><div><span className="welcome-chip">{business.industry || "TU NEGOCIO"}</span><h2>{business.name} ya tiene su espacio privado.</h2><p>{business.description || "Empieza agregando conocimiento para tu asistente."}</p></div><div className="welcome-dots">✦<br />↗</div></div><section className="progress-panel"><div><p className="eyebrow">Puesta en marcha</p><h2>Tu primer agente está al 50%</h2></div><div className="progress-track"><span className="half" /></div><div className="progress-labels"><span>Cuenta creada</span><span>Conocimiento</span><span>Canal</span><span>Activo</span></div></section><section><div className="dash-section-head"><div><p className="eyebrow">Tu agente</p><h2>Equipo de IA</h2></div><Link className="soft-button" href="/app/conocimiento">Administrar contenido</Link></div><div className="dash-cards one-card"><article className="agent-card"><div className="agent-card-top"><span className="dash-icon lime">✦</span><span className="status-draft">{agent?.status === "active" ? "ACTIVO" : "BORRADOR"}</span></div><h3>{agent?.name || `Asistente de ${business.name}`}</h3><p>Respuestas basadas solo en el conocimiento validado de tu negocio.</p><div className="agent-meta"><span>Conocimiento privado</span><span>WhatsApp pendiente</span></div><Link href="/app/conocimiento">Agregar fuentes →</Link></article></div></section><section className="next-steps"><p className="eyebrow">Siguiente paso recomendado</p><h2>Entrena tu asistente</h2><p>Agrega procedimientos, catálogo, preguntas frecuentes y documentos aprobados para que las respuestas sean confiables.</p><div className="setup-actions"><Link href="/app/conocimiento" className="button button-primary">Agregar conocimiento <span>→</span></Link></div></section></section></main>;
}
