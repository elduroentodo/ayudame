"use client";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import PublicNav from "@/components/public-nav";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Contraseña actualizada. Ya puedes iniciar sesión.");
  }
  return <><PublicNav/><main className="auth-page"><section className="auth-card"><p className="eyebrow">Nueva contraseña</p><h1>Protege tu cuenta.</h1><form className="auth-form" onSubmit={submit}><label>Nueva contraseña<input minLength={8} required type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="button button-primary">Guardar contraseña →</button></form>{message && <p className="auth-note">{message}</p>}</section></main></>;
}