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

Quality gates run locally (Husky hooks, installed via `pnpm install`) and in CI (GitHub Actions). Commit-message validation runs **only in CI** — the local `commit-msg` hook is intentionally empty, so a bad message fails the PR, not your local commit.

| When                                           | What runs                                                                                                    | Auto-fix | Purpose                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------- |
| **pre-commit** (Husky)                         | `lint-staged`: Prettier + ESLint `--fix` + Secretlint on staged files only                                   | yes      | Fast cleanup of what you touched; blocks committed secrets       |
| **pre-push** (Husky)                           | `pnpm verify` (lint + build + typecheck)                                                                     | no       | Catch failures locally before they reach CI                      |
| **CI** — `ci.yml` (PR to `main`/`development`) | lint, secretlint, build, typecheck, knip, dependency-cruiser, size-limit, publint, attw                      | no       | Quality gate before merge                                        |
| **CI** — `commit-msg.yml` (PR)                 | `commitlint` validates every commit in the PR ([Conventional Commits](https://www.conventionalcommits.org/)) | no       | Enforce `feat:`, `fix:`, `chore:`, etc. for changelog generation |
| **CI** — `changeset-check.yml` (PR)            | `changeset status` — fails if no changeset (skip with the `skip-changeset` label)                            | no       | Reminds contributors to declare a version bump                   |
| **CI** — `release.yml` (push to `main`)        | `changesets/action`: opens/updates the `chore: release` PR, or publishes to Verdaccio + tags on merge        | no       | Automated semver + changelog + publish                           |

Reusable composite actions live in `.github/actions/` (`setup-repo`: checkout + Node 22 + pnpm + cache + install; `commitlint`: message validation) so the same steps drop into sibling projects.

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

Releases are automated with [changesets](https://github.com/changesets/changesets) + the [changesets GitHub Action](https://github.com/changesets/action). **You never run `changeset version`, tag, or publish by hand** — the Action owns all of that. There is no tag-based trigger; everything keys off pushes to `main`.

The cycle:

1. **Per change** — run `pnpm changeset`, pick the bump (`patch`/`minor`/`major`) and write a summary. Commit the generated `.changeset/*.md` **alongside your code**. CI fails any PR with no changeset (unless labeled `skip-changeset`).

   ```bash
   pnpm changeset
   git add .changeset/ && git commit -m "feat: ..."   # with your code
   ```

2. **Merge to `main`** — on every push to `main`, `release.yml` runs the changesets Action:
   - **If changesets are pending** → it opens (or updates) a **`chore: release` PR** that runs `changeset version` for you: bumps `package.json`, writes `CHANGELOG.md`, deletes the consumed changesets.
   - **When you merge that Release PR** → the next push to `main` has no pending changesets, so the Action runs `pnpm release` (`build` + `changeset publish`) → publishes to Verdaccio and creates the git tag + GitHub Release automatically.

So the only manual steps are: **write changesets and merge PRs.** The version bump, changelog, tag, and publish are all automated.

> Requires the `NPM_TOKEN` repository secret (a Verdaccio auth token) for the publish step.

## Contributing

Branching:

- `main` — production, tagged releases
- `development` — integration branch
- `feat/*`, `fix/*`, `chore/*` — feature branches, PR into `development`

## License

Code in this repository is licensed under the [MIT License](./LICENSE) © Ricwolf19.

The `LICENSE` covers reusable code only. Documentation, branding (project name, logo, screenshots), and any non-code content are governed separately by the [NOTICE](./NOTICE) file and are **not** licensed for reuse under MIT.
