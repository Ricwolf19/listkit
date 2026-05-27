# listkit

> Standardized list views for React — table/cards, search, pagination, advanced filters. One config per entity, works with any data source.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/status-alpha-orange)](#status)

`@pibytelabs/listkit` is a React library that gives you a complete list view (toolbar, table, cards, pagination, filters) from a single declarative config. Designed to work across Next.js, Vite/React Router, and any data source (REST APIs, server actions, IndexedDB, in-memory arrays).

## Status

**Alpha — v0.x.** Active development. Not yet published to a public registry. Distributed via the `@pibytelabs` private Verdaccio.

## Phased roadmap

| Phase | Scope |
|---|---|
| **v0.x** | UI standardization: components, `defineListConfig`, router adapters, in-memory data |
| **v1.0** | `DataAdapter` abstraction — server-side search/pagination/sort, built-in `memoryAdapter` + `fetchAdapter` |
| **v2.0** | Declarative advanced filters with type-safe field paths |
| **v3.0+** | Bulk actions, export, column visibility, keyboard shortcuts, virtualization |

## Project layout

```
listkit/
├── packages/listkit/      # the publishable package (@pibytelabs/listkit)
└── playground/            # local Vite app for development
```

## Development

Requirements: **Node 22 LTS**, **pnpm 11+**.

```bash
pnpm install            # install all workspace deps
pnpm dev                # start the playground (Vite, localhost:5173)
pnpm build              # build the package
pnpm typecheck          # type check all workspaces
pnpm lint               # eslint
pnpm format             # prettier write
```

## Releasing

Releases use [changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset          # describe the change (interactive)
pnpm changeset version  # bump versions + update changelog
git commit -am "release: ..."
git tag v0.1.0
git push --follow-tags  # CI publishes to Verdaccio
```

## Contributing

Branching:
- `main` — production, tagged releases
- `development` — integration branch
- `feat/*`, `fix/*`, `chore/*` — feature branches, PR into `development`

## License

MIT © Ricwolf19
