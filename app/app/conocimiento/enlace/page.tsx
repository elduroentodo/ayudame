"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function AddLinkPage() {
  const [businessId,setBusinessId]=useState("");
  const [name,setName]=useState("");
  const [url,setUrl]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.replace("/login");return;}const {data}=await supabase.from("business_members").select("business_id").eq("user_id",user.id).limit(1).maybeSingle();if(!data?.business_id){window.location.replace("/app");return;}setBusinessId(data.business_id);})();},[]);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");const {error}=await supabase.from("knowledge_sources").insert({business_id:businessId,title:name.trim()||url,url,status:"pending"});if(error)setMessage(error.message);else window.location.assign("/app/conocimiento");setBusy(false);}
  return <main className="knowledge-page"><header className="knowledge-nav"><Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link><Link className="back-link" href="/app/conocimiento">← Volver a conocimiento</Link></header><section className="knowledge-shell"><form className="article-form" onSubmit={submit}><div><p className="eyebrow">Enlace web</p><h2>Agrega una página oficial</h2><p>Solo registra URLs públicas y confiables de tu negocio.</p></div><label>Nombre de la fuente<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Servicios y precios" /></label><label>URL<input type="url" required value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://tusitio.com/servicios" /></label>{message&&<p className="auth-note">{message}</p>}<div className="form-actions"><Link className="soft-button" href="/app/conocimiento">Cancelar</Link><button className="button button-primary" disabled={busy}>{busy?"Guardando…":"Guardar enlace"} <span>→</span></button></div></form></section></main>;
}