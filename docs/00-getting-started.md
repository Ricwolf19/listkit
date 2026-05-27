# Getting started

> Placeholder — fills in as v0.1 ships.

## Install

```bash
pnpm add @pibytelabs/listkit
```

The package is published to a private Verdaccio registry. Add this to your `.npmrc`:

```
@pibytelabs:registry=https://registry.alagrandelepusecuca.mx/
//registry.alagrandelepusecuca.mx/:_authToken=${NPM_TOKEN}
```

## Peer dependencies

- `react` ^18 or ^19
- `react-dom` ^18 or ^19
- `tailwindcss` ^4
- `lucide-react` ^0.4

## Tailwind v4 content config

`@pibytelabs/listkit` ships unstyled component primitives that use Tailwind utility classes. You must add the package to your Tailwind scan:

```css
/* your global stylesheet */
@import 'tailwindcss';
@source '../node_modules/@pibytelabs/listkit/dist';
```

## Next steps

- See [Concepts](./01-concepts.md) for the mental model
- See [Adapters](./02-adapters.md) for data and router pluggability
