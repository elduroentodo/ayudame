import Link from "next/link";

export default function AppPage() {
  return (
    <main className="dashboard">
      <aside className="dash-sidebar">
        <Link className="brand dash-brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></Link>
        <p className="workspace">ESPACIO DE TRABAJO</p>
        <strong className="company">Sebastian's workspace <span>⌄</span></strong>
        <nav>
          <a className="active" href="/app">▦ Resumen</a>
          <a href="#agentes">✦ Mis agentes <b>1</b></a>
          <a href="#flujos">⌘ Flujos</a>
          <a href="#conocimiento">◫ Conocimiento</a>
          <a href="#canales">◌ Canales</a>
        </nav>
        <div className="sidebar-help"><strong>Tu espacio está listo</strong><p>Completa los tres pasos para activar tu primer agente.</p><a href="#primer-agente">Ver configuración →</a></div>
      </aside>

      <section className="dash-content">
        <header>
          <div><p className="eyebrow">Tu espacio de trabajo</p><h1>Buenos días, Sebastian <span>✦</span></h1></div>
          <div className="user-card"><button className="profile">SE</button><span><strong>Sebastian Espindola</strong><small>Administrador</small></span></div>
        </header>

        <div className="welcome">
          <div><span className="welcome-chip">TU CUENTA DEMO</span><h2>Ya tienes un espacio para crear agentes que atienden tu negocio.</h2><p>Comienza con conocimiento, luego conecta tu canal de WhatsApp cuando estés listo.</p></div>
          <div className="welcome-dots">✦<br />↗</div>
        </div>

        <section className="progress-panel">
          <div><p className="eyebrow">Puesta en marcha</p><h2>Tu primer agente está al 25%</h2></div>
          <div className="progress-track"><span /></div>
          <div className="progress-labels"><span>Cuenta creada</span><span>Conocimiento</span><span>Canal</span><span>Activo</span></div>
        </section>

        <section id="agentes">
          <div className="dash-section-head"><div><p className="eyebrow">Tus agentes</p><h2>Tu equipo de IA</h2></div><button className="soft-button">+ Nuevo agente</button></div>
          <div className="dash-cards">
            <article className="agent-card">
              <div className="agent-card-top"><span className="dash-icon lime">✦</span><span className="status-draft">BORRADOR</span></div>
              <h3>Asistente de Hola Car</h3><p>Agente RAG para responder disponibilidad, precios y políticas de alquiler.</p>
              <div className="agent-meta"><span>0 fuentes</span><span>WhatsApp pendiente</span></div><button>Configurar agente →</button>
            </article>
            <article>
              <span className="dash-icon peach">⌘</span><h3>Flujo de cotización</h3><p>Guía al cliente hasta tener fechas, ciudad y tipo de vehículo.</p><button>Crear flujo →</button>
            </article>
            <article>
              <span className="dash-icon mint">◌</span><h3>Conectar WhatsApp</h3><p>Lleva tus agentes al canal donde ya te escriben tus clientes.</p><button>Conectar canal →</button>
            </article>
          </div>
        </section>

        <section id="primer-agente" className="next-steps">
          <p className="eyebrow">Siguiente paso recomendado</p><h2>Entrena el Asistente de Hola Car</h2><p>Agrega políticas, catálogo, preguntas frecuentes o un enlace a tu página. Ayúdame lo transforma en respuestas claras para tus clientes.</p>
          <div className="setup-actions"><button className="button button-primary">Agregar conocimiento <span>→</span></button><button className="soft-button">Ver guía de configuración</button></div>
        </section>
      </section>
    </main>
  );
}
