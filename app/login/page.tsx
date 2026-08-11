"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "recovery">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (mode === "recovery") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setMessage(error ? error.message : "Te enviamos un enlace para recuperar tu contraseña.");
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/app` },
      });
      setMessage(error ? error.message : "Revisa tu correo para confirmar tu cuenta.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else window.location.assign("/app");
    }

    setBusy(false);
  }

  async function continueWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setMessage("Google aún no está configurado: agrega sus credenciales en Supabase Auth.");
  }

  const title = mode === "signup" ? "Crea tu espacio de trabajo." : mode === "recovery" ? "Recupera tu acceso." : "Entra a tu centro de control.";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></Link>
        <p className="eyebrow">{mode === "signup" ? "Crea tu cuenta" : mode === "recovery" ? "Recupera tu cuenta" : "Bienvenido"}</p>
        <h1>{title}</h1>
        <p className="auth-copy">Crea, entrena y conecta agentes que atienden tu negocio.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Correo de trabajo<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@negocio.com" /></label>
          {mode !== "recovery" && <label>Contraseña<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></label>}
          <button className="button button-primary" disabled={busy}>{busy ? "Un momento..." : mode === "signup" ? "Crear cuenta" : mode === "recovery" ? "Enviar enlace" : "Entrar a Ayúdame"} <span>→</span></button>
        </form>
        {message && <p className="auth-note">{message}</p>}
        {mode === "login" && <><button className="auth-text-button" onClick={() => setMode("recovery")}>¿Olvidaste tu contraseña?</button><button className="auth-text-button" onClick={continueWithGoogle}>Continuar con Google</button><p className="auth-note">¿Aún no tienes cuenta? <button className="inline-button" onClick={() => setMode("signup")}>Créala aquí</button></p></>}
        {mode !== "login" && <button className="auth-text-button" onClick={() => setMode("login")}>Volver a iniciar sesión</button>}
      </section>
      <aside className="auth-aside"><p className="eyebrow">Tu primer agente</p><h2>Conocimiento claro.<br /><em>Conversaciones que venden.</em></h2><div className="auth-orbit"><span>RAG</span><span>WhatsApp</span><span>Excel</span></div></aside>
    </main>
  );
}
