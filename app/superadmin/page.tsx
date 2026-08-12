"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Profile = { id: string; full_name: string | null; email: string | null; active: boolean };
type Role = { user_id: string; role: "super_admin" | "admin" | "editor" | "viewer" };
const roles: Role["role"][] = ["super_admin", "admin", "editor", "viewer"];

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
  return <main className="admin-page"><header className="knowledge-nav"><Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link><Link className="back-link" href="/app">← Volver a la plataforma</Link></header><section className="admin-shell"><p className="eyebrow">Control de plataforma</p><h1>Personas y permisos</h1><p className="admin-intro">Administra quién puede entrar y con qué nivel de acceso. Desactivar bloquea el acceso a la plataforma; para bloquear la sesión de Supabase por completo se necesita la API de administración de servidor.</p>{message && <p className="auth-note">{message}</p>}<div className="admin-table"><div className="admin-row admin-head"><span>Perfil</span><span>Rol</span><span>Estado</span></div>{profiles.map((profile) => <div className="admin-row" key={profile.id}><div><strong>{profile.full_name || "Sin nombre"}</strong><small>{profile.email || profile.id}</small></div><select aria-label={"Rol de " + (profile.full_name || profile.email)} value={roleFor(profile.id)} onChange={(event) => changeRole(profile.id, event.target.value as Role["role"])}>{roles.map((role) => <option value={role} key={role}>{role.replace("_", " ")}</option>)}</select><button className={profile.active ? "status-active" : "status-off"} onClick={() => setActive(profile.id, !profile.active)}>{profile.active ? "Activo" : "Desactivado"}</button></div>)}</div></section></main>;
}