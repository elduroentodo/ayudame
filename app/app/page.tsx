import Link from "next/link";

export default function AppPage() {
  return (
    <main className="dashboard">
      <aside className="dash-sidebar">
        <Link className="brand dash-brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></Link>
        <p className="workspace">ESPACIO DE TRABAJO</p>
        <strong className="company">Mi negocio <span>⌄</span></strong>
        <nav>
          <a className="active" href="/app">▦ Resumen</a>
          <a href="#agentes">✦ Mis agentes</a>
          <a href="#flujos">⌘ Flujos</a>
          <a href="#conocimiento">◫ Conocimiento</a>
          <a href="#canales">◌ Canales</a>
        </nav>
        <div className="sidebar-help"><strong>¿Primera vez aquí?</strong><p>Configura tu agente paso a paso.</p><a href="mailto:sebastian.espindola.h@gmail.com">Pedir ayuda →</a></div>
      </aside>
      <section className="dash-content">
        <header><div><p className="eyebrow">Lunes, 10 de agosto</p><h1>Buenos días, Sebastian <span>✦</span></h1></div><button className="profile">SE</button></header>
        <div className="welcome">
          <div><span className="welcome-chip">NUEVO</span><h2>Convierte tus conversaciones en un equipo que nunca se desconecta.</h2><p>Empieza creando un agente de conocimiento o un flujo para atender clientes por WhatsApp.</p></div>
          <div className="welcome-dots">✦<br />↗</div>
        </div>
        <section id="agentes"><div className="dash-section-head"><div><p className="eyebrow">Tus agentes</p><h2>Empieza aquí</h2></div><Link href="/">Ver todos →</Link></div>
          <div className="dash-cards">
            <article><span className="dash-icon lime">✦</span><h3>Agente de conocimiento</h3><p>Entrénalo con tus documentos, enlaces y preguntas frecuentes.</p><button>Crear agente →</button></article>
            <article><span className="dash-icon peach">⌘</span><h3>Flujo de atención</h3><p>Guía cotizaciones, reservas y procesos con conversaciones simples.</p><button>Crear flujo →</button></article>
            <article><span className="dash-icon mint">◌</span><h3>Conectar WhatsApp</h3><p>Lleva tus agentes al canal donde ya te escriben tus clientes.</p><button>Conectar canal →</button></article>
          </div>
        </section>
        <section className="next-steps"><p className="eyebrow">Siguiente paso recomendado</p><h2>Crea tu primer agente RAG</h2><p>Sube la información que tus clientes preguntan todos los días y deja que Ayúdame la convierta en respuestas claras.</p><button className="button button-primary">Comenzar configuración <span>→</span></button></section>
      </section>
    </main>
  );
}
