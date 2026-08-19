# Cloudflare Workers AI para Ayúdame

Ayúdame usa **Cloudflare Workers AI** como proveedor predeterminado. No alojamos Ollama ni exponemos modelos en Vercel: Vercel llama al API de Cloudflare solo desde el servidor y conserva el token secreto.

## Configuración gratuita

1. Crea o inicia sesión en Cloudflare.
2. Abre **Workers AI** y elige **Use REST API**.
3. Selecciona **Create a Workers AI API Token** y copia el token una sola vez.
4. Copia también el **Account ID** que muestra esa misma pantalla.
5. En Vercel > proyecto Ayúdame > Settings > Environment Variables, agrega estas variables en **Production** y **Preview**:
   - `AI_PROVIDER=cloudflare`
   - `CLOUDFLARE_ACCOUNT_ID=<tu Account ID>`
   - `CLOUDFLARE_AI_TOKEN=<tu token secreto>`
   - `CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.2-3b-instruct`
6. Haz un redeploy de Vercel.

Nunca uses el prefijo `NEXT_PUBLIC_` para el token o el Account ID. El endpoint de Ayúdame exige una sesión de Supabase y resuelve el negocio/conocimiento en el servidor antes de llamar a Cloudflare.

## Límites

Workers AI Free incluye 10.000 Neurons al día. Cuando el límite se agota, el asistente responderá con error hasta el reinicio diario. El modelo inicial elegido es Llama 3.2 3B: económico y suficiente para respuestas breves basadas en artículos. Revisa el consumo en el panel de Workers AI.

## Ollama local (opcional)

Para seguir desarrollando con Ollama, usa `AI_PROVIDER=ollama` en `.env.local`, junto con `OLLAMA_BASE_URL` y `OLLAMA_MODEL`. No uses Ollama local en Vercel.
