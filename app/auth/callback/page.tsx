"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function AuthCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.getSession();
      if (!active) return;
      if (result.error || !result.data.session) {
        setError("No pudimos completar el inicio de sesión. Vuelve a intentarlo.");
        return;
      }
      window.location.replace("/app");
    })().catch(() => {
      if (active) setError("No pudimos completar el inicio de sesión. Vuelve a intentarlo.");
    });
    return () => { active = false; };
  }, []);

  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Conectando tu cuenta</p><h1>{error ? "No se pudo iniciar sesión" : "Un momento…"}</h1><p className="auth-copy">{error || "Estamos preparando tu espacio de Ayúdame."}</p>{error && <Link href="/login" className="button button-primary">Volver a ingresar</Link>}</section></main>;
}
