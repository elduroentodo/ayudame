"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function Probar() {
  const [articleCount, setArticleCount] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace("/login"); return; }
      const { data: membership } = await supabase.from("business_members")
        .select("business_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!membership?.business_id) { window.location.replace("/app"); return; }
      const { count, error } = await supabase.from("knowledge_articles")
        .select("id", { count: "exact", head: true })
        .eq("business_id", membership.business_id).eq("status", "published");
      if (!mounted) return;
      setArticleCount(error ? 0 : count || 0);
      setReady(true);
    })();
    return () => { mounted = false; };
  }, []);

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setAnswer("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.replace("/login"); return; }
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setAnswer(data.answer || data.error || "No fue posible responder.");
    } catch {
      setAnswer("No pudimos conectar con el asistente. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <main className="app-loading">Preparando tu asistente…</main>;
  return <main className="knowledge-page">
    <header className="knowledge-nav">
      <Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link>
      <Link className="back-link" href="/app">← Volver al resumen</Link>
    </header>
    <section className="knowledge-shell">
      <form className="article-form" onSubmit={ask}>
        <p className="eyebrow">Prueba tu asistente</p>
        <h2>Pregunta como lo haría un cliente</h2>
        <p>El asistente usará {articleCount} artículo(s) aprobado(s). Aún no incorpora el contenido de PDFs ni enlaces.</p>
        <label>Pregunta<input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} required placeholder="¿Qué servicios ofrecen?" /></label>
        <button className="button button-primary" disabled={busy || !articleCount}>{busy ? "Pensando…" : "Probar respuesta"} <span>→</span></button>
        {!articleCount && <p className="auth-note">Agrega al menos un artículo publicado para empezar.</p>}
        {answer && <div className="empty-sources"><strong>Respuesta</strong><p>{answer}</p></div>}
      </form>
    </section>
  </main>;
}
