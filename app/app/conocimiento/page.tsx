"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Business = { id: string; name: string };
type Article = { id: string; title: string; body: string; status: string; created_at: string };

export default function KnowledgePage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id, businesses(id, name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    const currentBusiness = membership?.businesses as unknown as Business | null;
    if (!currentBusiness) { window.location.replace("/app"); return; }
    setBusiness(currentBusiness);
    const { data } = await supabase
      .from("knowledge_articles")
      .select("id, title, body, status, created_at")
      .eq("business_id", currentBusiness.id)
      .order("created_at", { ascending: false });
    setArticles(data || []);
  }

  useEffect(() => { loadData(); }, []);

  async function saveArticle(event: FormEvent) {
    event.preventDefault();
    if (!business || !title.trim() || !body.trim()) return;
    setSaving(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("knowledge_articles").insert({
      business_id: business.id, title: title.trim(), body: body.trim(), status: "published", created_by: user?.id,
    });
    if (error) setMessage(error.message);
    else {
      setTitle(""); setBody(""); setOpenForm(false); await loadData();
    }
    setSaving(false);
  }

  if (!business) return <main className="app-loading">Cargando conocimiento…</main>;

  return (
    <main className="knowledge-page">
      <header className="knowledge-nav"><Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link><div><span className="business-pill">{business.name}</span><Link className="back-link" href="/app">← Volver al resumen</Link></div></header>
      <section className="knowledge-shell">
        <div className="knowledge-heading"><div><p className="eyebrow">Asistente de {business.name}</p><h1>Conocimiento</h1><p>Información privada que el asistente podrá usar al responder. Publica solo material revisado por la clínica.</p></div><button className="button button-primary" onClick={() => setOpenForm(true)}>+ Escribir artículo</button></div>
        <div className="knowledge-stats"><div><strong>{articles.length}</strong><span>artículos publicados</span></div><div><strong>—</strong><span>documentos y enlaces</span></div><div><strong>{articles[0] ? "Hoy" : "—"}</strong><span>última actualización</span></div></div>

        {openForm && <form className="article-form" onSubmit={saveArticle}>
          <div><p className="eyebrow">Nuevo artículo</p><h2>Enseña algo a tu asistente</h2><p>Incluye información clara, vigente y aprobada por Fer Beauty.</p></div>
          <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Cuidados posteriores a Botox" required /></label>
          <label>Contenido<textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe aquí el contenido que el asistente debe conocer…" required /></label>
          <div className="form-actions"><button className="soft-button" type="button" onClick={() => setOpenForm(false)}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Publicando…" : "Publicar artículo"} <span>→</span></button></div>
          {message && <p className="auth-note">{message}</p>}
        </form>}

        <div className="knowledge-layout">
          <section><div className="tabs"><button className="active">Artículos</button><button disabled>Enlaces (próximamente)</button><button disabled>Documentos (próximamente)</button></div>
            <div className="source-list">{articles.length ? articles.map((article) => <article className="source-row" key={article.id}><span className="source-icon lime">✎</span><div><strong>{article.title}</strong><p>Artículo publicado · {new Date(article.created_at).toLocaleDateString("es-CO")}</p></div><span className="status-draft">PUBLICADO</span></article>) : <div className="empty-sources"><strong>Aún no hay artículos.</strong><p>Crea el primero para empezar a entrenar el asistente de Fer Beauty.</p><button className="soft-button" onClick={() => setOpenForm(true)}>Escribir artículo</button></div>}</div>
          </section>
          <aside className="knowledge-help"><span className="dash-icon lime">✦</span><h2>Contenido seguro</h2><p>Incluye procedimientos, precios y cuidados aprobados. Para síntomas, contraindicaciones o diagnósticos, el agente debe pedir que contacte al equipo clínico.</p><ul><li>Artículos: disponible</li><li>URLs: siguiente fase</li><li>PDFs: siguiente fase</li></ul></aside>
        </div>
      </section>
    </main>
  );
}
