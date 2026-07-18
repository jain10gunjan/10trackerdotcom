# Folder structure conventions

## Layout

- `src/app/` — Next.js App Router routes only (thin `page.js` / `route.js` + layouts).
- `src/features/<domain>/` — domain UI, hooks, server logic, and domain helpers.
- `src/components/{ui,layout}/` — shared UI only (Navbar, primitives).
- `src/lib/` — cross-cutting infra (Supabase, auth helpers, cache, HTTP, config).
- `src/context/` — React providers (single home).
- `src/hooks/` — shared hooks only; domain hooks live under `features/<domain>/hooks/`.
- `docs/` — product and setup markdown (not feature code).
- `supabase/migrations/` — all SQL schema/migration scripts.
- `scripts/` — non-SQL ops scripts only.

## Naming

- Folders: `kebab-case` (e.g. `exam-hub`, `mock-test-hub`).
- React components: `PascalCase`.
- Prefer `@/features/...`, `@/lib/...`, `@/context/...` imports.

## Rules

- Domain-only code → `features/<domain>/`.
- Used by two or more domains → `src/lib`, `src/hooks`, or `src/components`.
- `app/**/page.js` and `app/api/**/route.js` compose and call feature modules; they should not hold large business logic.

## Non-goals (this restructure)

- Do not merge `mock-test` with `mock-test-hub`.
- Do not merge `/article` with `/articles` URL trees.
- Do not collapse legacy exam paths (`/mhcet`, `/gate-cse`, etc.) into `[category]`.
