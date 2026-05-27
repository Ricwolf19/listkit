# @pibytelabs/listkit

> Standardized list views for React.

**Status:** alpha (v0.x). Not yet feature-complete. See [the monorepo README](../../README.md) for the phased roadmap.

## Install

```bash
pnpm add @pibytelabs/listkit
```

Requires `react ^18 || ^19`, `react-dom`, `lucide-react`, and `tailwindcss ^4` as peer dependencies.

## Subpath exports

```ts
import { ListView, defineListConfig } from '@pibytelabs/listkit'
import { nextRouterAdapter } from '@pibytelabs/listkit/next'
import { reactRouterAdapter } from '@pibytelabs/listkit/react-router'
import { memoryAdapter, fetchAdapter } from '@pibytelabs/listkit/adapters'
```

## Tailwind v4 setup

Add this package to your Tailwind `content` scan:

```js
// app/globals.css (Tailwind v4 CSS-first config)
@import 'tailwindcss';
@source '../node_modules/@pibytelabs/listkit/dist';
```

## License

MIT
