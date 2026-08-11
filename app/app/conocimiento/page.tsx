"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Business = { id: string; name: string };
type Article = { id: string; title: string; status: string; created_at: string };
type Document = { id: string; file_name: string; status: string; created_at: string };

export default function KnowledgePage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const { data: membership } = await supabase.from("business_members").select("business_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (!membership?.business_id) { window.location.replace("/app"); return; }
    const { data: currentBusiness } = await supabase.from("businesses").select("id, name").eq("id", membership.business_id).maybeSingle();
    if (!currentBusiness) { window.location.replace("/app"); return; }
    setBusiness(currentBusiness);
    const [{ data: articleData }, { data: documentData }] = await Promise.all([
      supabase.from("knowledge_articles").select("id, title, status, created_at").eq("business_id", currentBusiness.id).order("created_at", { ascending: false }),
      supabase.from("knowledge_documents").select("id, file_name, status, created_at").eq("business_id", currentBusiness.id).order("created_at", { ascending: false }),
    ]);
    setArticles(articleData || []); setDocuments(documentData || []);
  }

  useEffect(() => { loadData(); }, []);
  async function saveArticle(event: FormEvent) { event.preventDefault(); if (!business || !title.trim() || !body.trim()) return; setSaving(true); setMessage(""); const { data: { user } } = await supabase.auth.getUser(); const { error } = await supabase.from("knowledge_articles").insert({ business_id: business.id, title: title.trim(), body: body.trim(), status: "published", created_by: user?.id }); if (error) setMessage(error.message); else { setTitle(""); setBody(""); setOpenForm(false); await loadData(); } setSaving(false); }
  if (!business) return <main className="app-loading">Cargando conocimiento…</main>;
  return <main className="knowledge-page"><header className="knowledge-nav"><Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link><div><span className="business-pill">{business.name}</span><Link className="back-link" href="/app">← Volver al resumen</Link></div></header><section className="knowledge-shell"><div className="knowledge-heading"><div><p className="eyebrow">Asistente de {business.name}</p><h1>Conocimiento</h1><p>Información privada que el asistente podrá usar al responder.</p></div><button className="button button-primary" onClick={() => setOpenForm(true)}>+ Escribir artículo</button></div><div className="knowledge-stats"><div><strong>{articles.length}</strong><span>artículos publicados</span></div><div><strong>{documents.length}</strong><span>documentos PDF</span></div><div><strong>{articles[0] || documents[0] ? "Hoy" : "—"}</strong><span>última actualización</span></div></div>{openForm && <form className="article-form" onSubmit={saveArticle}><div><p className="eyebrow">Nuevo artículo</p><h2>Enseña algo a tu asistente</h2><p>Incluye información clara, vigente y aprobada por tu negocio.</p></div><label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Preguntas frecuentes" required /></label><label>Contenido<textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe el contenido…" required /></label><div className="form-actions"><button className="soft-button" type="button" onClick={() => setOpenForm(false)}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Publicando…" : "Publicar artículo"} <span>→</span></button></div>{message && <p className="auth-note">{message}</p>}</form>}<div className="knowledge-layout"><section><div className="tabs"><button className="active">Todo</button><Link className="soft-button" href="/app/conocimiento/enlace">+ Agregar enlace</Link></div><div className="source-list">{[...articles.map((item) => ({ ...item, kind: "Artículo", icon: "✎" })), ...documents.map((item) => ({ ...item, title: item.file_name, kind: "PDF", icon: "PDF" }))].length ? [...articles.map((item) => ({ ...item, kind: "Artículo", icon: "✎" })), ...documents.map((item) => ({ ...item, title: item.file_name, kind: "PDF", icon: "PDF" }))].map((item) => <article className="source-row" key={item.id}><span className="source-icon lime">{item.icon}</span><div><strong>{item.title}</strong><p>{item.kind} · {new Date(item.created_at).toLocaleDateString("es-CO")}</p></div><span className="status-draft">LISTO</span></article>) : <div className="empty-sources"><strong>Aún no hay contenido.</strong><p>Crea el primer artículo para entrenar tu asistente.</p><button className="soft-button" onClick={() => setOpenForm(true)}>Escribir artículo</button></div>}</div></section><aside className="knowledge-help"><span className="dash-icon lime">✦</span><h2>Contenido seguro</h2><p>Incluye procedimientos, precios y cuidados aprobados. El agente debe derivar diagnósticos o casos sensibles al equipo humano.</p><ul><li>Artículos: disponible</li><li>PDFs iniciales: disponible</li><li>URLs: siguiente fase</li></ul></aside></div></section></main>;
}
