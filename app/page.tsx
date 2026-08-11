const WhatsAppIcon = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="/">
          <span className="brand-mark">a</span>
          <span>ayúdame</span>
        </a>
        <div className="nav-links">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#soluciones">Soluciones</a>
          <a href="#contacto">Contacto</a>
        </div>
        <a className="button button-small button-dark" href="/login">Iniciar sesión</a>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow"><span className="pulse" /> IA práctica para negocios reales</p>
          <h1>Tu negocio responde.<br /><em>Incluso cuando tú descansas.</em></h1>
          <p className="hero-text">
            Crea asistentes de WhatsApp que conocen tu negocio, atienden clientes y automatizan tareas.
            Sin aprender tecnología. Sin equipos costosos.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/login">Crear mi primer agente <span>→</span></a>
            <a className="text-link" href="#como-funciona">Ver cómo funciona <span>↓</span></a>
          </div>
          <div className="trust-row">
            <div className="avatars"><i>MS</i><i>LC</i><i>AR</i></div>
            <span>Hecho para equipos que prefieren<br /><strong>hablar con sus clientes.</strong></span>
          </div>
        </div>

        <div className="hero-product" aria-label="Vista previa de un asistente de Ayúdame">
          <div className="product-topbar">
            <span className="live-dot" /> Agente activo
            <span className="product-menu">•••</span>
          </div>
          <div className="chat-head">
            <div className="chat-logo">H</div>
            <div><strong>Hola Car · Asistente</strong><small>Responde en WhatsApp</small></div>
            <span className="online">● En línea</span>
          </div>
          <div className="chat-body">
            <div className="bubble bubble-in">Hola, ¿tienen carros disponibles este viernes?</div>
            <div className="bubble bubble-out">¡Hola, Valentina! Sí 😊 Tenemos disponibles el Kia Rio y la Renault Duster. ¿En qué ciudad necesitas recogerlo?</div>
            <div className="bubble bubble-in">En Bogotá, cerca al aeropuerto.</div>
            <div className="typing"><span /><span /><span /></div>
          </div>
          <div className="product-footer">
            <span>Entrenado con 24 documentos</span>
            <span className="mini-badge">WhatsApp</span>
          </div>
        </div>
      </section>

      <section className="proof shell">
        <p>TODO LO QUE NECESITAS PARA ATENDER MEJOR</p>
        <div><strong>24/7</strong><span>respuestas</span></div>
        <div><strong>1 lugar</strong><span>para tus agentes</span></div>
        <div><strong>0 código</strong><span>para empezar</span></div>
      </section>

      <section id="soluciones" className="solutions shell">
        <div className="section-intro">
          <p className="eyebrow">Dos formas de automatizar</p>
          <h2>Empieza con lo que<br />tu negocio ya sabe.</h2>
          <p>Ayúdame convierte documentos, procesos y datos cotidianos en conversaciones útiles para tus clientes.</p>
        </div>
        <div className="solution-grid">
          <article className="solution-card knowledge">
            <div className="card-number">01</div>
            <div className="solution-icon">✦</div>
            <h3>Conocimiento que responde</h3>
            <p>Sube catálogos, PDFs, manuales, páginas web o documentos. Tu agente encuentra la respuesta correcta y la explica con naturalidad.</p>
            <ul><li>Base de conocimiento RAG</li><li>Respuestas con ChatGPT</li><li>Listo para WhatsApp</li></ul>
            <a href="/login">Crear agente de conocimiento <span>→</span></a>
          </article>
          <article className="solution-card workflow">
            <div className="card-number">02</div>
            <div className="solution-icon">⌘</div>
            <h3>Flujos que hacen el trabajo</h3>
            <p>Diseña conversaciones para cotizar, reservar, calificar clientes o consultar un Excel. Describe el caso y Ayúdame guía el diálogo.</p>
            <ul><li>Conversaciones paso a paso</li><li>Datos de Excel y formularios</li><li>Escala a una persona cuando hace falta</li></ul>
            <a href="/login">Crear un flujo <span>→</span></a>
          </article>
        </div>
      </section>

      <section id="como-funciona" className="how">
        <div className="shell">
          <div className="section-intro light">
            <p className="eyebrow">Simple desde el día uno</p>
            <h2>De tu negocio a WhatsApp<br />en tres pasos.</h2>
          </div>
          <div className="steps">
            <div><span>1</span><h3>Cuéntanos qué haces</h3><p>Agrega servicios, preguntas frecuentes, archivos o una página web.</p></div>
            <div><span>2</span><h3>Elige cómo debe ayudar</h3><p>Configura respuestas, tono y los datos que debe recoger.</p></div>
            <div><span>3</span><h3>Conéctalo y empieza</h3><p>Publica tu agente en WhatsApp y revisa las conversaciones desde un solo lugar.</p></div>
          </div>
        </div>
      </section>

      <section className="builders shell">
        <div>
          <p className="eyebrow">Para trabajar contigo, no en lugar de ti</p>
          <h2>Tu equipo, con superpoderes.</h2>
          <p>Cuando necesites algo más avanzado, Ayúdame está listo para conectarse con APIs y asistentes como Codex o Claude. Ellos configuran; tú decides.</p>
          <a className="text-link dark-link" href="/login">Explorar la plataforma <span>→</span></a>
        </div>
        <div className="builder-stack">
          <div className="integration integration-main"><span className="integration-logo">a</span><strong>ayúdame</strong><small>Centro de control</small></div>
          <div className="integration integration-left"><span>⌘</span><strong>Codex</strong><small>Configuración asistida</small></div>
          <div className="integration integration-right"><span>✺</span><strong>Claude</strong><small>Flujos personalizados</small></div>
          <div className="connector-line line-one" /><div className="connector-line line-two" />
        </div>
      </section>

      <section id="contacto" className="contact shell">
        <div>
          <p className="eyebrow">Hablemos de tu negocio</p>
          <h2>La atención que tu cliente merece empieza aquí.</h2>
          <p>Cuéntanos qué quieres automatizar y te ayudamos a diseñar tu primer agente.</p>
        </div>
        <div className="contact-actions">
          <a className="contact-link" href="mailto:sebastian.espindola.h@gmail.com"><span>✉</span> sebastian.espindola.h@gmail.com</a>
          <a className="contact-link" href="https://wa.me/573142726805"><WhatsAppIcon /> +57 314 272 6805</a>
          <a className="button button-primary" href="/login">Empezar ahora <span>→</span></a>
        </div>
      </section>

      <footer className="footer shell">
        <a className="brand" href="/"><span className="brand-mark">a</span><span>ayúdame</span></a>
        <span>IA simple para negocios que no se detienen.</span>
        <span>© 2026 Ayúdame</span>
      </footer>
    </main>
  );
}
