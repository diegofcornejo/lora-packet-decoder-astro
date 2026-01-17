# AGENTS.md - LoRa Packet Decoder

This document provides guidance for AI coding agents working on this codebase.

## Project Overview

A LoRaWAN packet decoder web application built with Astro, React, and Tailwind CSS. Users can decode hex-encoded or Base64 LoRa packets, with optional keys for MIC validation and payload decryption.

## Tech Stack

- **Framework**: Astro 5.x with SSR mode
- **UI Library**: React 19.x
- **Styling**: Tailwind CSS v4 (via Vite plugin)
- **Deployment**: Vercel
- **Package Manager**: Bun (preferred) or npm

## Build/Lint/Test Commands

### Development
```bash
bun run dev          # Start development server
bun run start        # Alias for dev
```

### Build
```bash
bun run build        # Production build
bun run preview      # Preview production build locally
```

### Testing
No test framework is currently configured. If adding tests, consider Vitest for Astro projects.

### Linting
No ESLint/Prettier configuration exists. If adding linting:
```bash
# Suggested future commands
bun run lint         # Run ESLint
bun run format       # Run Prettier
```

## Project Structure

```
src/
├── components/          # UI components
│   ├── *.astro         # Static/layout components
│   ├── *.jsx           # Interactive React components
│   └── *.module.css    # Component-specific styles
├── layouts/
│   └── Layout.astro    # Main layout wrapper
├── pages/
│   ├── index.astro     # Home page
│   └── decode.js       # API endpoint (POST /decode)
└── styles/
    └── tailwind.css    # Tailwind entry point
```

## Code Style Guidelines

### File Naming
- **Astro components**: PascalCase (`Header.astro`, `Layout.astro`)
- **React components**: PascalCase (`Decoder.jsx`, `Card.jsx`)
- **CSS Modules**: `ComponentName.module.css`
- **API routes**: lowercase (`decode.js`)

### Component Patterns

#### Astro Components (`.astro`)
Use for static/layout components that don't need client-side interactivity:
```astro
---
// Frontmatter: server-side TypeScript
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<div>{title}</div>

<style>
  /* Scoped styles */
</style>
```

#### React Components (`.jsx`)
Use for interactive components requiring client-side state:
```jsx
import { useState, useEffect } from 'react';
import styles from './Component.module.css';

export default function Component({ prop }) {
  const [state, setState] = useState(initialValue);
  
  // Component logic...
  
  return <div className={styles.wrapper}>...</div>;
}
```

Hydration in Astro pages:
```astro
<ReactComponent client:load />
```

### Import Order
1. React imports (`useState`, `useEffect`)
2. Third-party libraries (`sonner`, `xss`)
3. Local components (relative paths with `.jsx` extension)
4. Styles (CSS modules)

```jsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import xss from 'xss';
import Card from './Card.jsx';
import styles from './Component.module.css';
```

### Styling

1. **Tailwind CSS**: Primary approach - use utility classes inline
   ```jsx
   <div className="flex flex-col gap-4 p-4 bg-gray-700 rounded-lg">
   ```

2. **CSS Modules**: For complex component-specific styles
   ```jsx
   import styles from './Card.module.css';
   <div className={styles.card}>
   ```

3. **Responsive design**: Use Tailwind breakpoint prefixes
   ```jsx
   <div className="text-sm md:text-base lg:text-lg">
   ```

### TypeScript Usage
- TypeScript is available but JSX is preferred for React components
- Use TypeScript interfaces in Astro frontmatter for props
- Type definitions in `src/env.d.ts`

### Naming Conventions

- **Functions**: camelCase, descriptive verbs
  - Event handlers: `handle` prefix (`handleDecode`, `handleClear`)
  - Data transformers: descriptive action (`sanitizeAndHighlightWarnings`)
- **State variables**: camelCase (`isLoading`, `decodedBuffer`)
- **Constants**: camelCase for component-level, SCREAMING_SNAKE_CASE for module-level
- **CSS classes**: kebab-case in CSS modules, Tailwind utilities inline

### API Routes

Located in `src/pages/`, export named functions for HTTP methods:
```javascript
export async function POST({ params, request }) {
  try {
    const body = await request.json();
    // Process request...
    return new Response(JSON.stringify(result));
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

### Error Handling

- Use try/catch blocks for async operations
- API routes: Return 500 status with error message on failure
- Client-side: Use toast notifications for user feedback
  ```jsx
  import { toast } from 'sonner';
  
  toast.error('Error message');
  toast.success('Success message');
  toast.warning('Warning message');
  toast.loading('Loading...');
  ```

### State Management

- Local component state via React hooks (`useState`, `useEffect`)
- Persistent storage via `localStorage`
- No global state management library

### Security

- Sanitize HTML output using `xss` library before rendering with `dangerouslySetInnerHTML`
- Validate user inputs before API calls

### Analytics

- Umami analytics integration
- Add `data-umami-event` attributes to track user interactions:
  ```jsx
  <button data-umami-event="decode-button">Decode</button>
  ```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `lora-packet` | LoRaWAN packet parsing/decoding |
| `sonner` | Toast notifications |
| `xss` | HTML sanitization |
| `react-content-loader` | Loading skeleton components |

## Common Tasks

### Adding a new React component
1. Create `src/components/ComponentName.jsx`
2. Optionally create `src/components/ComponentName.module.css`
3. Use `client:load` directive when importing in Astro files

### Adding a new API endpoint
1. Create file in `src/pages/` (e.g., `src/pages/api/endpoint.js`)
2. Export HTTP method handlers (`GET`, `POST`, etc.)
3. Return `Response` objects

### Modifying styles
- Prefer Tailwind utilities for simple changes
- Use CSS modules for complex, reusable component styles
- Global styles go in `Layout.astro` with `is:global`
