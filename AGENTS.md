# AGENTS.md - LoRa Packet Decoder

Guidance for agentic coding tools working in this repository.

## Project Overview

LoRaWAN packet decoder web app built with Astro, React, and Tailwind CSS. Users decode hex/Base64 packets with optional keys for MIC validation and payload decryption.

## Tech Stack

- Framework: Astro 5.x (SSR output)
- UI: React 19.x
- Styling: Tailwind CSS v4 (Vite plugin)
- Runtime: Vercel adapter
- Package manager: Bun preferred, npm ok

## Build, Lint, Test Commands

### Install
```bash
bun install
```

### Dev
```bash
bun run dev
bun run start
```

### Build + Preview
```bash
bun run build
bun run preview
```

### Type Check
```bash
bun run astro check
```

### Lint (Oxlint)
```bash
bunx oxlint
```

### Tests (Vitest)
```bash
bun run test
bun run test:run
bun run test:ui
bun run test:coverage
bun run test:unit
bun run test:api
bun run test:components
```

### Run a Single Test
```bash
bun run test -- tests/components/Card.test.jsx
bun run test -- -t "loads history"
bun run test:run -- tests/unit/decoder.test.js
```

## Repository Layout

```
src/components/    Astro + React UI components
src/layouts/       Layout wrapper
src/pages/         Pages + API routes (decode.js)
src/styles/        Tailwind entry point
tests/             Vitest suites (unit/api/components)
```

## Code Style Guidelines

### File Naming
- Astro components: PascalCase (e.g., `Header.astro`)
- React components: PascalCase (e.g., `Decoder.jsx`)
- CSS modules: `ComponentName.module.css`
- API routes: lowercase (e.g., `decode.js`)

### Formatting
- Use tabs for indentation (matches existing files).
- Prefer single quotes in JS/JSX/Astro.
- Preserve the existing semicolon style in the file you edit.
- Keep Tailwind classes grouped by layout -> spacing -> color for readability.
- Keep line lengths reasonable; wrap long JSX props for readability.

### Imports
Order imports consistently:
1. React hooks
2. Third-party libraries
3. Local components/utilities (use `.jsx` extension)
4. Styles (CSS modules)

Alias: `@` resolves to `src` (Vitest config).

### React Components
- Functional components with hooks only.
- Local state via `useState`/`useEffect`; no global state library.
- Prefer inline Tailwind utilities; use CSS modules for complex styling.
- Use `client:load` for hydrated components in `.astro` pages.
- Keep component files focused; extract helpers to `src/utils` when logic grows.

### Astro Components
- Keep frontmatter minimal; use interfaces for props when needed.
- Global styles live in `src/layouts/Layout.astro` with `is:global`.

### Types
- The codebase is primarily JS/JSX; introduce TypeScript only if a file already uses it.
- For complex object shapes, use JSDoc typedefs instead of adding TS config.

### Naming Conventions
- Functions: camelCase verbs (`handleDecode`, `sanitizeAndHighlightWarnings`).
- Event handlers: `handle` prefix.
- State variables: camelCase (`isLoading`, `decodedBuffer`).
- Constants: camelCase for local, `SCREAMING_SNAKE_CASE` for module-level.

### API Routes
- Located in `src/pages/` and export named HTTP handlers (`POST`, `GET`).
- Parse request with `await request.json()`.
- Always return `Response` with JSON.
- Validate input early and return 400 with a clear JSON error payload.

### Error Handling
- Wrap async logic in try/catch.
- API routes: return 500 with `{ error: error.message }`.
- UI: use `sonner` toasts for feedback (error/success/warning/loading).
- Wrap `localStorage` access in try/catch (see `Decoder.jsx`).
- Avoid throwing raw errors from UI event handlers; surface them via toasts.

### Security
- Sanitize HTML before `dangerouslySetInnerHTML` with `xss`.
- Validate user input before sending to `/decode`.

### Analytics
- Use Umami events via `data-umami-event` attributes on user actions.

### Testing Notes
- Vitest environment is `jsdom` with globals enabled.
- Setup file: `tests/setup.js` (mocks `localStorage`, `fetch`, `confirm`).
- Test files live under `tests/**` with `.test` or `.spec` naming.
- Prefer testing user-visible behavior over implementation details.

### Tooling Notes
- `lint-staged` runs `oxlint` on staged files.
- `commitlint` enforces conventional commits.