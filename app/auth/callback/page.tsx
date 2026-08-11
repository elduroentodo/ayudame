"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function AuthCallback() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    (async () => {
      if (code) await supabase.auth.exchangeCodeForSession(code);
      window.location.replace("/app");
    })();
  }, []);
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">Conectando tu cuenta</p><h1>Un momento…</h1><p className="auth-copy">Estamos preparando tu espacio de Ayúdame.</p></section></main>;
}