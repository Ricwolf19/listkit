# listkit

> Standardized list views for React — table/cards, search, pagination, advanced filters. One config per entity, works with any data source.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/status-alpha-orange)](#status)

`@pibytelabs/listkit` is a React library that gives you a complete list view (toolbar, table, cards, pagination, filters) from a single declarative config. Designed to work across Next.js, Vite/React Router, and any data source (REST APIs, server actions, IndexedDB, in-memory arrays).

## Status

**Alpha — v0.x.** Active development. Not yet published to a public registry. Distributed via the `@pibytelabs` private Verdaccio.

## Phased roadmap

| Phase     | Scope                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------- |
| **v0.x**  | UI standardization: components, `defineListConfig`, router adapters, in-memory data                       |
| **v1.0**  | `DataAdapter` abstraction — server-side search/pagination/sort, built-in `memoryAdapter` + `fetchAdapter` |
| **v2.0**  | Declarative advanced filters with type-safe field paths                                                   |
| **v3.0+** | Bulk actions, export, column visibility, keyboard shortcuts, virtualization                               |

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
pnpm fix                # apply all auto-fixes (prettier + eslint + knip)
pnpm verify             # run the same checks CI runs (lint + build + typecheck)
pnpm verify:full        # full set: + format:check + knip + depcruise
```

## Automation

Quality gates run at three moments. Hooks are managed by [Husky](https://typicode.github.io/husky/) and installed automatically via `pnpm install`.

| When                                       | What runs                                                                         | Auto-fix | Purpose                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| **pre-commit**                             | `lint-staged`: Prettier + ESLint `--fix` + Secretlint on staged files only        | yes      | Fast cleanup of what you touched; blocks committed secrets       |
| **commit-msg**                             | `commitlint` against [Conventional Commits](https://www.conventionalcommits.org/) | no       | Enforce `feat:`, `fix:`, `chore:`, etc. for changelog generation |
| **pre-push**                               | `pnpm verify` (lint + build + typecheck)                                          | no       | Catch failures locally before they reach CI                      |
| **CI** (PR + push to `main`/`development`) | lint, secretlint, build, typecheck, knip, dependency-cruiser, size-limit, publint | no       | Final gate before merge / publish                                |
| **CI** (PR only)                           | `changeset status` check                                                          | no       | Reminds contributors to declare a version bump                   |
| **CI** (push to `main`)                    | `changesets/action`: opens a Release PR, or publishes to Verdaccio on merge       | no       | Automated semver + changelog + publish                           |

Skip a hook in an emergency with `git commit --no-verify` or `git push --no-verify`. By convention, never skip on `main` or release branches.

## Tooling reference

| Tool                     | Role                                                                    |
| ------------------------ | ----------------------------------------------------------------------- |
| **tsup**                 | Bundles the package to ESM + CJS + `.d.ts` (4 entries, subpath exports) |
| **TypeScript**           | Strict mode, `noUncheckedIndexedAccess`                                 |
| **ESLint** (flat config) | Code rules + `simple-import-sort` for import order                      |
| **Prettier**             | Formatting + `prettier-plugin-tailwindcss` for class sorting            |
| **Secretlint**           | Detects API keys / tokens accidentally staged                           |
| **Knip**                 | Detects unused exports, files, dependencies                             |
| **dependency-cruiser**   | Catches circular deps and enforces architectural boundaries             |
| **size-limit**           | Per-entry bundle budget (rejects oversized PRs)                         |
| **publint**              | Validates `package.json` for npm publishability                         |
| **changesets**           | Manual changelogs + automated versioning + publish                      |

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

Code in this repository is licensed under the [MIT License](./LICENSE) © Ricwolf19.

The `LICENSE` covers reusable code only. Documentation, branding (project name, logo, screenshots), and any non-code content are governed separately by the [NOTICE](./NOTICE) file and are **not** licensed for reuse under MIT.
