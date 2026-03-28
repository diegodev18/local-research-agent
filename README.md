# Local Research Agent

**Local Research Agent** es un monorepo con un agente de investigación (solo lectura): la API usa Gemini con herramientas para listar directorios, buscar en archivos y leer ficheros dentro de un workspace acotado. La web es un chat (React + Vite + shadcn/ui) que habla con esa API.

## Requisitos

- [Bun](https://bun.com) (recomendado v1.3+)
- Clave [Google AI / Gemini](https://ai.google.dev/) (`GOOGLE_API_KEY`)

## Estructura

| Ruta | Descripción |
|------|-------------|
| `apps/api` | Servidor Hono + Bun, bucle de agente con `@google/generative-ai` |
| `apps/web` | SPA React: chat con Markdown en los mensajes |
| `docker/` | Entrypoint de clonado de repo, Nginx y ejemplo de variables para Compose |

## Desarrollo local

Instalar dependencias en la raíz (workspaces):

```bash
bun install
```

### API

```bash
cd apps/api
cp .env.example .env   # edita GOOGLE_API_KEY y, si quieres, AGENT_WORKSPACE_ROOT
bun run dev
```

Por defecto escucha en **http://localhost:3000**. El workspace del agente es `process.cwd()` de la API salvo que definas `AGENT_WORKSPACE_ROOT` (ruta absoluta al código que quieras inspeccionar).

### Web

En otra terminal:

```bash
cd apps/web
bun run dev
```

Abre **http://localhost:5173**. Vite hace **proxy** de `/api` al puerto 3000, así el chat usa rutas relativas sin CORS extra.

### Arrancar API y web desde la raíz

```bash
bun install
bun run dev
```

(Asegúrate de tener `apps/api/.env` configurado.)

## API HTTP (resumen)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Comprobación simple |
| `GET` | `/api/agent` | Capacidades del agente (`tools`, `workspaceRoot`, etc.) |
| `POST` | `/api/agent/chat` | Cuerpo JSON: `{ "message": string, "history?": { "role": "user"\|"model", "content": string }[] }`. Respuesta: `{ "reply", "run" }` |

Variables de entorno de la API: ver [apps/api/.env.example](apps/api/.env.example).

## Docker Compose (repo público + agente)

Permite pasar la URL **HTTPS** de un repositorio Git **público**: el contenedor de la API lo clona en `/workspace` y el agente lee solo ese árbol.

1. Copia [docker/.env.example](docker/.env.example) a **`.env` en la raíz del monorepo** (Compose carga ese archivo por defecto).
2. Rellena al menos `GOOGLE_API_KEY` y `REPO_URL` (ej. `https://github.com/org/repo.git`).
3. Con Docker Desktop (o motor Docker) en marcha:

```bash
docker compose up --build
```

- Interfaz: **http://localhost:8080**
- La web (Nginx) sirve el estático y hace proxy de `/api/` al servicio `api` en el puerto 3000.

Opcionales en `.env`: `REPO_REF` (rama/tag), `FORCE_REPO_REFRESH=true` para forzar un clon limpio del volumen, y el resto de variables del agente como en `apps/api/.env.example`.

Detalles de la imagen: [Dockerfile](Dockerfile) (multi-stage: API Bun + web estática con Nginx).

## Build de producción (sin Docker)

```bash
bun run build
```

Genera `apps/web/dist` y compila lo necesario de la API según los scripts de cada app.

## Seguridad

El agente **no** debe exponer un workspace sin acotar en entornos no confiables. En Docker solo se clona la URL que configures; revisa el origen del repositorio. No subas `.env` con claves al repositorio.
