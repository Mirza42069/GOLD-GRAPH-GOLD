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

## Directory map
- `app/` holds routes, `layout.tsx`, and global styles.
- `components/` contains shared UI and example compositions.
- `components/ui/` contains shadcn primitives and patterns.
- `lib/` contains utilities such as `cn`.
- `public/` can host static assets if added later.

## Install
- `bun install`
- Only use bun for installs and scripts.

## Development commands (bun)
- Dev server: `bun run dev`
- Build: `bun run build`
- Start (requires build): `bun run start`
- Lint: `bun run lint`
- One-off binary: `bun x <tool>`

## Tests
- No test runner or `test` script is configured in `package.json`.
- Single-test command: not available until a runner is added.
- If you add tests, document the runner and single-test usage here.

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

## Accessibility
- Always pair inputs with `label`/`htmlFor` or `aria-label`.
- Use `sr-only` for icon-only buttons (see `component-example.tsx`).
- Ensure focusable elements are reachable and keyboard friendly.

## Data fetching
- Use server components for data loading by default.
- Prefer async functions in `app/` over client-side fetches.
- Keep fetch logic close to the page or a dedicated data module.

## State management
- Use local state (`useState`) for local UI controls.
- Lift state only when needed; avoid premature global stores.

## Assets
- `app/favicon.ico` is the current favicon.
- Remote images in examples use plain `img`; consider `next/image` for real content.

## Fonts
- Fonts are loaded via `next/font/google` in `app/layout.tsx`.
- `Inter` and `Geist` variables are attached to `html`/`body`.

## Cursor and Copilot rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.
- If such rules are added, mirror them here.

## Agent guardrails
- Do not delete or reformat large blocks without need.
- Keep changes minimal and consistent with nearby code.
- Do not add new tools or dependencies unless required.
- When unsure, follow the closest existing pattern.

## Suggested workflows
- Start a task: check `package.json` scripts and relevant files.
- After changes: run `bun run lint`.
- Build before release: `bun run build`.

## Single-test placeholder
- When a test runner is added, document:
- `bun run test`
- `bun run test -- <single test pattern>`
- Update this section with the real command.

## References
- `package.json` for scripts and dependencies.
- `eslint.config.mjs` for lint config.
- `tsconfig.json` for TS options and alias.
- `app/globals.css` for theme tokens and Tailwind setup.

## Notes
- This repo currently ships only a minimal example UI.
- Keep examples readable and aligned with shadcn patterns.

## End
- Keep this file up to date as tooling changes.
