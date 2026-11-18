"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Profile = { id: string; full_name: string | null; email: string | null; active: boolean };
type Role = { user_id: string; role: "super_admin" | "admin" | "editor" | "viewer" };
const roles: Role["role"][] = ["super_admin", "admin", "editor", "viewer"];

type WhatsAppRequest = {
  business_id: string; business_name: string; contact_email: string; contact_phone: string;
  whatsapp_number: string; note: string; status: "pending" | "in_progress" | "ready"; created_at: string;
};

function WhatsAppRequests() {
  const [requests, setRequests] = useState<WhatsAppRequest[]>([]);
  const [message, setMessage] = useState("");

  async function loadRequests() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const response = await fetch("/api/whatsapp/requests", { headers: { Authorization: `Bearer ${session.access_token}` } });
    const result = await response.json() as { requests?: WhatsAppRequest[]; error?: string };
    if (!response.ok) { setMessage(result.error || "No pudimos cargar las solicitudes."); return; }
    setRequests(result.requests || []);
  }
  useEffect(() => { void loadRequests(); }, []);

  async function changeStatus(businessId: string, status: "pending" | "in_progress") {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const response = await fetch("/api/whatsapp/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ businessId, status }),
    });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Solicitud actualizada." : result.error || "No pudimos actualizarla.");
    if (response.ok) void loadRequests();
  }

  return <section className="admin-requests">
    <p className="eyebrow">WhatsApp</p><h2>Solicitudes de conexión</h2>
    <p>Estos negocios pidieron ayuda para conectar su número. La activación de respuestas se hace después de probarlo con ellos.</p>
    {message && <p className="auth-note" role="status">{message}</p>}
    {!requests.length ? <div className="admin-request-empty">Aún no hay solicitudes.</div> : <div className="admin-request-list">{requests.map((item) => <article className="admin-request" key={item.business_id}>
      <div><span className="status-draft">{item.status === "in_progress" ? "EN GESTIÓN" : item.status === "ready" ? "LISTO" : "PENDIENTE"}</span><h3>{item.business_name}</h3><p>WhatsApp: <strong>{item.whatsapp_number}</strong></p><p>Contacto: <a href={`tel:${item.contact_phone}`}>{item.contact_phone}</a> · <a href={`mailto:${item.contact_email}`}>{item.contact_email}</a></p>{item.note && <p>Nota: {item.note}</p>}</div>
      {item.status !== "ready" && <button className="soft-button" type="button" onClick={() => changeStatus(item.business_id, item.status === "pending" ? "in_progress" : "pending")}>{item.status === "pending" ? "Marcar en gestión" : "Volver a pendiente"}</button>}
    </article>)}</div>}
  </section>;
}

export default function SuperAdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roleRows, setRoleRows] = useState<Role[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const { data: ownRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (ownRole?.role !== "super_admin") { setAllowed(false); return; }
    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase.from("user_profiles").select("id, full_name, email, active").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles(profileData || []); setRoleRows((roleData || []) as Role[]); setAllowed(true);
  }
  useEffect(() => { load(); }, []);
  const roleFor = (id: string) => roleRows.find((item) => item.user_id === id)?.role || "viewer";
  async function changeRole(id: string, role: Role["role"]) {
    const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", id);
    setMessage(error ? error.message : "Rol actualizado."); if (!error) load();
  }
  async function setActive(id: string, active: boolean) {
    const { error } = await supabase.from("user_profiles").update({ active }).eq("id", id);
    setMessage(error ? error.message : active ? "Perfil activado." : "Perfil desactivado."); if (!error) load();
  }
  if (allowed === null) return <main className="app-loading">Verificando permisos…</main>;
  if (!allowed) return <main className="admin-page"><div className="admin-empty"><p className="eyebrow">Acceso restringido</p><h1>Esta área es para SuperAdmin.</h1><p>Solicita acceso a la persona administradora de Ayúdame.</p><Link className="button button-primary" href="/app">Volver a la plataforma</Link></div></main>;
  return <main className="admin-page">
    <header className="knowledge-nav"><Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link><Link className="back-link" href="/app">Volver a la plataforma</Link></header>
    <section className="admin-shell">
      <p className="eyebrow">Control de plataforma</p><h1>Personas y permisos</h1>
      <p className="admin-intro">Administra quién puede entrar y con qué nivel de acceso. Desactivar bloquea el acceso a la plataforma; para bloquear la sesión de Supabase por completo se necesita la API de administración de servidor.</p>
      {message && <p className="auth-note">{message}</p>}
      <div className="admin-table"><div className="admin-row admin-head"><span>Perfil</span><span>Rol</span><span>Estado</span></div>{profiles.map((profile) => <div className="admin-row" key={profile.id}><div><strong>{profile.full_name || "Sin nombre"}</strong><small>{profile.email || profile.id}</small></div><select aria-label={"Rol de " + (profile.full_name || profile.email)} value={roleFor(profile.id)} onChange={(event) => changeRole(profile.id, event.target.value as Role["role"])}>{roles.map((role) => <option value={role} key={role}>{role.replace("_", " ")}</option>)}</select><button className={profile.active ? "status-active" : "status-off"} onClick={() => setActive(profile.id, !profile.active)}>{profile.active ? "Activo" : "Desactivado"}</button></div>)}</div>
      <WhatsAppRequests />
    </section>
  </main>;
}
