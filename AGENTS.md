# AGENTS

## Purpose
- This file guides agentic coding assistants in this repo.
- Use it as the source of truth for commands and code style.
- Follow existing patterns; avoid sweeping reformatting.

## Repo quick facts
- Framework: Next.js 16 App Router.
- Language: TypeScript (strict) + React 19.
- Styling: Tailwind CSS v4 with shadcn and tw-animate.
- Package manager: bun.
- Alias: `@/` maps to repo root via `tsconfig.json`.
- Gold price data: from MetalpriceAPI (requires API token in .env.local). Note: free plan is daily-delayed.

## Directory map
- `app/` holds routes, `layout.tsx`, and global styles.
- `components/` contains shared UI and example compositions.
- `components/gold/` contains the Gold Graph app UI.
- `components/ui/` contains shadcn primitives and patterns.
- `lib/` contains utilities such as `cn` and gold API functions.
- `public/` can host static assets if added later.

## Install
- `bun install`
- Only use bun for installs and scripts.

## Development commands (bun)
- Dev server: `bun run dev`
- Build: `bun run build`
- Start (requires build): `bun run start`
- Lint: `bun run lint`
- Typecheck (standalone): `bun x tsc -p tsconfig.json --noEmit`
- One-off binary: `bun x <tool>`

## Tests
- No test runner or `test` script is configured in `package.json`.
- Single-test command: not available until a runner is added.
- If you add tests, also add `bun run test` and document single-test usage.

## Linting
- ESLint is configured via `eslint.config.mjs`.
- Uses `eslint-config-next` core-web-vitals + typescript.
- Respect `globalIgnores` in the config (e.g., `.next/`, `out/`).

## TypeScript
- `strict: true` and `noEmit: true`; keep type errors at zero.
- Prefer `import type` for type-only imports.
- Keep `@/` alias for internal modules.
- Avoid `any`; use explicit unions or generics.

## Imports
- Order groups: React/Next, third-party, internal (`@/`), relative.
- Separate groups with a blank line.
- Keep named imports sorted or logical as used in the file.
- Use `import type` for types from `next` or local modules.

## Formatting
- No repo-wide formatter config (no Prettier/biome files).
- Preserve the style of the file you are editing.
- Many component files use: no semicolons, double quotes, trailing commas.
- Avoid reflowing long JSX blocks unless you are touching them.

## React and Next.js
- App Router in `app/` with server components by default.
- Add `"use client"` only when a component needs client APIs.
- Pages use default exports; shared components use named exports.
- Metadata lives in `app/layout.tsx` (use `Metadata` type).
- Prefer functional components declared with `function`.
- Next.js 16 dynamic APIs: `searchParams` may be a Promise; make pages `async` and `await` it before reading.

## Components and UI
- UI primitives live in `components/ui` (shadcn style).
- Example/demo components live in `components/`.
- Reuse `cn` from `lib/utils.ts` for `className` merging.
- Keep `data-slot` attributes and structure when extending shadcn UI.
- Icons come from `lucide-react`; keep imports grouped.

## Styling and CSS
- Global styles in `app/globals.css`.
- Tailwind v4 is loaded via `@import "tailwindcss"`.
- Theme tokens are defined in `@theme inline` and `:root`.
- Prefer Tailwind utility classes over inline styles.
- Use design tokens (e.g., `bg-background`, `text-foreground`).
- Keep CSS variables in ASCII and in existing sections.
- Respect `prefers-reduced-motion`; keep animations subtle.

## App routing and query params
- Gold Graph lives at `/`.
- Query params:
- `unit=oz|g` (omit for default ounce).
- When changing query params in client components, use `next/navigation` router and push a full href.

## Data model
- Gold price + small recent history fetched from MetalpriceAPI on every page load.
- `lib/gold.ts` contains `fetchGoldSeries()` which returns current price, recent daily series (max 5 days on free plan), and timestamp.
- API token stored in `.env.local` as `METALPRICE_API_KEY`.
- Uses Next.js data cache with tags; click the in-app Refresh button to revalidate.

## File and naming conventions
- Files use kebab-case: `component-example.tsx`, `input-group.tsx`.
- Components are PascalCase: `ComponentExample`, `AlertDialog`.
- Hooks are camelCase with `use` prefix: `useSomething`.
- Constants are camelCase; enums or config objects may be UPPER_SNAKE.

## Error handling
- Prefer guard clauses and explicit empty states in UI.
- Wrap async client code with try/catch and show a user-safe message.
- For server components, consider `error.tsx` boundaries when needed.
- Avoid swallowing errors; log or surface in development.
- Keep React hooks unconditional (ESLint `react-hooks` is enforced).

## Accessibility
- Always pair inputs with `label`/`htmlFor` or `aria-label`.
- Use `sr-only` for icon-only buttons (see `component-example.tsx`).
- Ensure focusable elements are reachable and keyboard friendly.

## Data fetching
- Prefer server components for data loading and heavy computation.
- Keep client components focused on interaction (hover, input, router navigation).

## Cursor and Copilot rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.
- If such rules are added, mirror them here.

## Performance (Vercel guidance)
- Avoid waterfalls: run independent work in parallel; await late.
- Keep client bundle small: avoid heavy deps; prefer server rendering.
- Memoize expensive derived values in client components (`useMemo`) and keep effect deps minimal.
- Animate wrappers (div) instead of SVG elements when possible.

## Agent guardrails

- Keep changes minimal and consistent with nearby code.
- Do not add new tools or dependencies unless required.

## Single-test placeholder

- Add `bun run test`.
- Support single-test runs: `bun run test -- <pattern>`.

## Notes
- Demo components exist in `components/`; prefer editing the real app in `components/gold/`.
- `.env*` is gitignored; do not commit secrets.
