import Link from "next/link";

const sources = [
  { icon: "✎", title: "Procedimientos faciales: guía de atención", type: "Artículo", meta: "Borrador · Hace un momento", color: "lime" },
  { icon: "↗", title: "Preguntas frecuentes de Fer Beauty", type: "Enlace web", meta: "Pendiente de procesar", color: "peach" },
  { icon: "PDF", title: "Cuidados posteriores a Botox.pdf", type: "Documento", meta: "Listo para subir", color: "mint" },
];

export default function KnowledgePage() {
  return (
    <main className="knowledge-page">
      <header className="knowledge-nav"><Link className="brand" href="/app"><span className="brand-mark">a</span><span>ayúdame</span></Link><div><span className="business-pill">Fer Beauty</span><Link className="back-link" href="/app">← Volver al resumen</Link></div></header>
      <section className="knowledge-shell">
        <div className="knowledge-heading"><div><p className="eyebrow">Asistente de Fer Beauty</p><h1>Conocimiento</h1><p>Todo lo que tu asistente puede usar para responder con claridad y seguridad.</p></div><button className="button button-primary">+ Agregar contenido</button></div>
        <div className="knowledge-stats"><div><strong>0</strong><span>fuentes publicadas</span></div><div><strong>0</strong><span>fragmentos entrenados</span></div><div><strong>—</strong><span>última actualización</span></div></div>
        <div className="knowledge-layout">
          <section><div className="tabs"><button className="active">Todas las fuentes</button><button>Artículos</button><button>Enlaces</button><button>Documentos</button></div>
            <div className="source-list">{sources.map((source) => <article className="source-row" key={source.title}><span className={`source-icon ${source.color}`}>{source.icon}</span><div><strong>{source.title}</strong><p>{source.type} · {source.meta}</p></div><button className="row-menu">•••</button></article>)}</div>
          </section>
          <aside className="knowledge-help"><span className="dash-icon lime">✦</span><h2>¿Qué debe saber tu asistente?</h2><p>Agrega información sobre procedimientos, precios, requisitos, cuidados y preguntas frecuentes.</p><ul><li>Escribe un artículo</li><li>Agrega una URL</li><li>Sube un PDF</li></ul><button className="soft-button">Ver ejemplo de artículo</button></aside>
        </div>
      </section>
    </main>
  );
}
