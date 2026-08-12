# Ollama local para Ayúdame

Ollama permite usar un modelo abierto sin API de OpenAI mientras desarrollas. Corre en tu computador, no dentro de Vercel.

## Instalación local
1. Instala Ollama desde https://ollama.com.
2. En Terminal ejecuta: `ollama pull qwen2.5:7b`.
3. Levanta Ayúdame localmente con `npm install` y `npm run dev`.
4. Crea `.env.local`:
```
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

La ruta `/api/ask` exige una sesión de Supabase, identifica el negocio en el servidor y solo usa sus artículos aprobados. No recibe nombre de negocio ni contexto desde el navegador.

## Producción
Vercel no puede conectar a `127.0.0.1` de tu computador. Antes de habilitar WhatsApp público se necesita alojar Ollama en un servidor con GPU/CPU o cambiar a un proveedor remoto como Groq. Nunca expongas la URL privada ni credenciales en variables `NEXT_PUBLIC_`.
