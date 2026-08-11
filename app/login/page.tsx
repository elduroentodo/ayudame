import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></Link>
        <p className="eyebrow">Bienvenido</p>
        <h1>Entra a tu centro de control.</h1>
        <p className="auth-copy">Aquí vas a crear, entrenar y conectar los agentes que atienden tu negocio.</p>
        <form className="auth-form">
          <label>Correo de trabajo<input type="email" placeholder="tu@negocio.com" /></label>
          <label>Contraseña<input type="password" placeholder="••••••••" /></label>
          <Link className="button button-primary" href="/app">Entrar a Ayúdame <span>→</span></Link>
        </form>
        <p className="auth-note">Demo inicial: el acceso real con contraseña llegará en la siguiente fase.</p>
      </section>
      <aside className="auth-aside"><p className="eyebrow">Tu primer agente</p><h2>Conocimiento claro.<br /><em>Conversaciones que venden.</em></h2><div className="auth-orbit"><span>RAG</span><span>WhatsApp</span><span>Excel</span></div></aside>
    </main>
  );
}
