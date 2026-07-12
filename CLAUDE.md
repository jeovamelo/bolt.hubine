# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

- **Dev Server**: `pnpm run dev` (serves on http://localhost:5173)
- **Lint**: `pnpm run lint` and `pnpm run lint:fix`
- **Type Check**: `pnpm run typecheck`
- **Build**: `pnpm run build`
- **Build & Preview**: `pnpm run preview` (runs production build locally)
- **Test**: `pnpm test` (Vitest)

## Technology Stack

- **Framework**: Remix (React meta-framework) with Vite bundler
- **Language**: TypeScript (strict mode enabled)
- **Runtime**: Node.js 18+ (Cloudflare Workers compatible)
- **UI**: React 18 + Tailwind CSS + UnoCSS + Radix UI primitives
- **State Management**: Nanostores (lightweight, reactive store system)
- **Data Persistence**: IndexedDB (browser storage) + localStorage/cookies
- **AI Integration**: Vercel AI SDK with custom provider abstraction
- **Package Manager**: pnpm 9.14.4
- **Deployment**: Cloudflare Pages (primary), also supports Vercel/Netlify
- **Desktop**: Electron (see electron/ directory for main/preload scripts)

## Project Structure

```
app/
├── routes/                    # Remix file-based routing
│   ├── _index.tsx            # Home page
│   ├── chat.$id.tsx          # Chat detail page
│   ├── api.*.ts              # API endpoints (Remix actions/loaders)
│   └── webcontainer.*.tsx    # WebContainer preview routes
├── components/
│   ├── chat/                 # Chat UI components (messages, input, etc.)
│   ├── editor/               # Code editor components (CodeMirror wrapper)
│   ├── header/               # Top bar UI
│   ├── @settings/            # Settings UI (nested route components)
│   └── deploy/               # Deployment-related components
├── lib/
│   ├── .server/              # Server-only code (runs on Remix server)
│   │   └── llm/              # LLM orchestration logic
│   ├── modules/llm/          # LLM provider implementations
│   │   └── providers/        # Concrete provider classes (OpenAI, Claude, etc.)
│   ├── stores/               # Nanostores (shared state)
│   ├── persistence/          # IndexedDB abstraction
│   ├── services/             # Service classes (MCP, GitHub, etc.)
│   └── hooks/                # Custom React hooks
└── types/                     # TypeScript type definitions

electron/                      # Electron desktop app
├── main/                      # Main process (window management)
└── preload/                   # Preload scripts (IPC bridge)

public/                        # Static assets
scripts/                       # Build/utility scripts
```

## Key Architectural Patterns

### 1. LLM Provider System
The codebase abstracts all LLM interactions through a provider interface in `app/lib/modules/llm/base-provider.ts`. Each provider (OpenAI, Claude, DeepSeek, etc.) extends this base class:

- **Message Streaming**: Providers implement streaming responses using Vercel's `streamText` API
- **Token Tracking**: Usage data (tokens) is collected in `api.chat.ts` in the `onFinish` callback
- **Configuration**: Providers read API keys from cookies (`apiKeys`) and settings (`providerSettings`)
- **Files**: Each provider has a class like `OpenAIProvider`, `AnthropicProvider`, etc. in `app/lib/modules/llm/providers/`

**Important**: The streaming system collects token usage in `cumulativeUsage` object which accumulates across multiple LLM calls and model continuations.

### 2. State Management with Nanostores
All global state uses Nanostores (not Redux/Zustand):

```typescript
// Example from app/lib/stores/
import { atom, map, computed } from 'nanostores';

export const chatStore = atom<Chat | null>(null);
export const logsStore = map<Record<string, LogEntry>>({});
```

Key stores:
- `chat.ts` - Current chat
- `files.ts` - Project files (code editor state)
- `workbench.ts` - Terminal, previews, artifacts
- `logs.ts` - System logs (has `logStore` singleton with methods like `logAPIRequest()`)
- `settings.ts` - User preferences, provider configs
- `github.ts` / `gitlab.ts` - Git integration state
- `supabase.ts` - Database connection state

### 3. Chat & Message Persistence
- **IndexedDB Schema**: `chats` object store with message history
- **Persistence Location**: `app/lib/persistence/chats.ts` (low-level DB access)
- **Metadata**: Chats store `IChatMetadata` with provider, model, timestamp info
- **Configuration**: Provider/API keys stored in cookies (sent with requests, visible in `api.chat.ts` route)

### 4. Remix API Routes Pattern
Remix uses file-based routing. API endpoints are created with `api.*.ts` naming:

```typescript
// app/routes/api.chat.ts - handles POST /api/chat
export async function action({ context, request }: ActionFunctionArgs) {
  // context = Cloudflare bindings
  // request = Request object
  return new Response(...);
}
```

Other key endpoints:
- `api.llmcall.ts` - Direct LLM calls (used internally)
- `api.configured-providers.ts` - List available providers
- `api.models.$provider.ts` - List models for a provider
- `api.health.ts` - Health check

### 5. WebContainer & Terminal
- **WebContainer**: Browser-based development environment (from @webcontainer/api)
- **Integration**: Managed in `app/lib/webcontainer/` and routed through `webcontainer.*.tsx`
- **Terminal**: Virtual terminal connected to WebContainer environment
- **State**: Terminal state in `workbench.ts`

### 6. Markdown & Code Rendering
- **Markdown**: React Markdown with Rehype/Remark plugins (see `app/components/chat/Markdown.tsx`)
- **Code Blocks**: CodeMirror editor for syntax highlighting + execution capability
- **Artifacts**: Special rendered blocks for generated code (handled by `Artifact.tsx`)

## Common Development Tasks

### Adding a New LLM Provider

1. Create `app/lib/modules/llm/providers/MyProvider.ts` extending `BaseProvider`
2. Register in `app/lib/modules/llm/llm-manager.ts` (look for `registerProvider` calls)
3. Add API key input in settings UI (`app/components/@settings/tabs/providers/cloud/CloudProvidersTab.tsx`)
4. Update type definitions if needed in `app/types/`

### Accessing User Configuration
In Remix routes, cookies contain provider settings:

```typescript
const cookieHeader = request.headers.get('Cookie');
const apiKeys = JSON.parse(parseCookies(cookieHeader || '').apiKeys || '{}');
const providerSettings = JSON.parse(parseCookies(cookieHeader || '').providers || '{}');
```

### Logging & Analytics
Use the `logStore` singleton from `app/lib/stores/logs.ts`:

```typescript
import { logStore } from '~/lib/stores/logs';

logStore.logAPIRequest(endpoint, method, duration, statusCode);
logStore.logError('message', error);
logStore.logPerformance('operation', duration);
```

Logs are stored in IndexedDB and available via `logStore.getLogs()`.

### Modifying UI Components
- **Settings Tabs**: Add new tabs in `app/components/@settings/tabs/`
- **Chat Components**: Chat UI in `app/components/chat/`
- **Styling**: Tailwind classes + UnoCSS utilities (see `uno.config.ts`)

## Important Files & Patterns

| File | Purpose |
|------|---------|
| `app/routes/api.chat.ts` | Main chat streaming endpoint, collects token usage |
| `app/lib/modules/llm/base-provider.ts` | Provider interface all implementations extend |
| `app/lib/.server/llm/stream-text.ts` | LLM message streaming orchestration |
| `app/lib/stores/logs.ts` | Logging system with IndexedDB persistence |
| `app/lib/persistence/db.ts` | IndexedDB schema and connection |
| `vite.config.ts` | Vite/Remix build config, includes path aliases (`~/*` → `./app/*`) |
| `tsconfig.json` | TypeScript config, also defines path aliases |
| `uno.config.ts` | UnoCSS configuration for utility classes |

## Deployment & Runtime

### Development
- **Local**: `pnpm run dev` uses Remix Vite dev server with hot reload
- **Environment Files**: `.env` and `.env.local` for API keys (loaded by vite.config.ts)

### Production Build
- **Command**: `pnpm run build` (creates `build/` folder)
- **Hosting**: Cloudflare Pages (`pnpm run deploy`)
- **Wrangler**: Used for local preview (`pnpm run start:windows` / `pnpm run start:unix`)

### Docker
- **Dev Image**: `pnpm run dockerbuild` (development with hot reload via bind-mount)
- **Prod Image**: `pnpm run dockerbuild:prod` (self-contained build)
- **Compose**: `docker compose up --profile development/production`

### Electron Desktop App
- **Build All Platforms**: `pnpm run electron:build:dist`
- **Platform-Specific**:
  - macOS: `pnpm run electron:build:mac`
  - Windows: `pnpm run electron:build:win`
  - Linux: `pnpm run electron:build:linux`
- **Dev Mode**: `pnpm run electron:dev` (runs Remix dev + Electron window)

## Testing

- **Runner**: Vitest (configured in vite.config.ts)
- **Command**: `pnpm test` (runs all tests)
- **Watch Mode**: `pnpm run test:watch`
- **Coverage**: Not currently configured

Note: As of now, test files are limited. New tests should be added as needed.

## Code Quality

- **Linter**: ESLint (config in `eslint.config.mjs`)
- **Code Style**: Prettier (runs via lint:fix)
- **Type Checking**: `pnpm run typecheck` (runs tsc)
- **Git Hooks**: Husky (pre-commit hooks configured in `prepare` script)

## Key Dependencies & Why They Matter

- **@ai-sdk/\***: Vercel AI SDK provider packages (one per LLM provider, auto-installed)
- **nanostores**: Global state without boilerplate
- **@remix-run/\***: Remix framework packages
- **lucide-react**: Icon library
- **@radix-ui/\***: Unstyled, accessible UI primitives
- **@webcontainer/api**: Browser-based code execution environment
- **@modelcontextprotocol/sdk**: MCP client for tool integration
- **electron** + **electron-builder**: Desktop app packaging
- **wrangler**: Cloudflare Workers/Pages CLI

## Important Notes

1. **Path Aliases**: `~/*` resolves to `./app/*` (defined in tsconfig.json and used by Vite)
2. **Server-Only Code**: Code in `app/lib/.server/` runs only on the Remix server, never in browser
3. **Cookie-Based Config**: User API keys and provider settings travel in HTTP cookies with each request
4. **Token Tracking**: All LLM calls accumulate token usage which is sent to frontend via `usage` message annotation
5. **IndexedDB**: Browser storage is unreliable for analytics—consider backend persistence for production
6. **Streaming**: Chat responses use Server-Sent Events (SSE) for real-time streaming via DataStream API
7. **Chrome 129 Issue**: Special handling in vite.config.ts for Chrome 129 module issues (see `chrome129IssuePlugin`)

## Related Documentation

- [README.md](./README.md) - Setup, features, and provider configuration
- [PROJECT.md](./PROJECT.md) - Project management guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines
- [FAQ.md](./FAQ.md) - Common questions and recommended models
