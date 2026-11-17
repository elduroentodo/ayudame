"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { listBusinessIds, preferredBusinessId } from "@/lib/workspace";

export default function AddLinkPage() {
  const [businessId, setBusinessId] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) { window.location.replace("/login"); return; }
        const businessIds = await listBusinessIds(user.id);
        const selectedId = preferredBusinessId(user.id, businessIds);
        if (!selectedId) { window.location.replace("/app"); return; }
        setBusinessId(selectedId);
      } catch {
        setLoadError("No pudimos identificar tu negocio. Vuelve al resumen e intenta de nuevo.");
      }
    })();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!businessId || busy) return;
    let normalizedUrl: string;
    try {
      const parsed = new URL(url.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported URL");
      normalizedUrl = parsed.toString();
    } catch {
      setMessage("Escribe una URL válida que empiece por https:// o http://.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.from("knowledge_sources").insert({
        business_id: businessId,
        title: name.trim() || normalizedUrl,
        url: normalizedUrl,
        status: "pending",
      });
      if (error) setMessage(error.message);
      else window.location.assign("/app/conocimiento");
    } catch {
      setMessage("No pudimos guardar el enlace. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Enlace web</p><h1>No pudimos cargarlo</h1><p className="auth-copy">{loadError}</p><Link className="button button-primary" href="/app">Volver al resumen</Link></section></main>;

  return <main className="knowledge-page">
    <header className="knowledge-nav">
      <Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link>
      <Link className="back-link" href="/app/conocimiento">← Volver a conocimiento</Link>
    </header>
    <section className="knowledge-shell">
      <form className="article-form" onSubmit={submit}>
        <div><p className="eyebrow">Enlace web</p><h2>Agrega una página oficial</h2><p>Solo registra URLs públicas y confiables de tu negocio.</p></div>
        <label>Nombre de la fuente<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Servicios y precios" /></label>
        <label>URL<input type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://tusitio.com/servicios" /></label>
        {message && <p className="auth-note">{message}</p>}
        <div className="form-actions">
          <Link className="soft-button" href="/app/conocimiento">Cancelar</Link>
          <button className="button button-primary" disabled={busy || !businessId}>{busy ? "Guardando…" : "Guardar enlace"} <span>→</span></button>
        </div>
      </form>
    </section>
  </main>;
}
