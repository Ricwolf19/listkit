# listkit

> Standardized list views for React — table/cards, search, advanced filters, pagination, and theming. One config per entity, works with any data source.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@pibytelabs/listkit` is a React library that gives you a complete list view (toolbar, table, cards, pagination, filters) from a single declarative config. Designed to work across Next.js, Vite/React Router, and any data source (REST APIs, server actions, IndexedDB, in-memory arrays).

## Project layout

```
listkit/
├── packages/listkit/      # the publishable package (@pibytelabs/listkit)
│   ├── src/
│   │   ├── adapters/      # memory, fetch, serverAction, dexie
│   │   ├── components/    # ListView, Table, Cards, Toolbar, filters/* …
│   │   ├── hooks/         # useListState, useListParams, router adapters …
│   │   ├── theme/         # built-in palettes + ThemeClasses contract
│   │   └── types/         # public TypeScript types
│   └── README.md          # consumer docs (install, API, examples)
├── playground/            # local Vite app for development & manual testing
└── .changeset/            # pending version bumps + changelogs
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

Quality gates run locally (Husky hooks, installed via `pnpm install`) and in CI (GitHub Actions).

| When                                           | What runs                                                                                                    | Auto-fix | Purpose                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------- |
| **pre-commit** (Husky)                         | `lint-staged`: Prettier + ESLint `--fix` + Secretlint on staged files only                                   | yes      | Fast cleanup of what you touched; blocks committed secrets       |
| **pre-push** (Husky)                           | `pnpm verify` (lint + build + typecheck)                                                                     | no       | Catch failures locally before they reach CI                      |
| **CI** — `ci.yml` (PR to `main`/`development`) | lint, secretlint, build, typecheck, knip, dependency-cruiser, size-limit, publint, attw                      | no       | Quality gate before merge                                        |
| **CI** — `commit-msg.yml` (PR)                 | `commitlint` validates every commit in the PR ([Conventional Commits](https://www.conventionalcommits.org/)) | no       | Enforce `feat:`, `fix:`, `chore:`, etc. for changelog generation |
| **CI** — `changeset-check.yml` (PR)            | `changeset status` — fails if no changeset (skip with the `skip-changeset` label)                            | no       | Reminds contributors to declare a version bump                   |
| **CI** — `release.yml` (push to `main`)        | Builds, publishes to Verdaccio, and pushes the git tag                                                       | no       | Automated publish + tag on merge                                 |

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

Releases use [changesets](https://github.com/changesets/changesets) with a **manual prepare step** followed by CI publish.

1. **Per change** — run `pnpm changeset`, pick the bump (`patch`/`minor`/`major`) and write a summary. Commit the generated `.changeset/*.md` **alongside your code**. CI fails any PR with no changeset (unless labeled `skip-changeset`).

   ```bash
   pnpm changeset
   git add .changeset/ && git commit -m "feat: ..."
   ```

2. **Prepare the release** — from the `development` branch, run:

   ```bash
   pnpm release:prepare
   ```

   This consumes all pending changesets, bumps `package.json`, writes `CHANGELOG.md`, and commits the result.

3. **Open a Release PR** — push `development` and open a PR to `main` with the `skip-changeset` label.

4. **Merge to `main`** — on push to `main`, `release.yml` builds the package, publishes to Verdaccio if the version is new, and pushes the git tag automatically.

So the manual steps are: **write changesets → run `release:prepare` → merge PR.** The publish and tag are automated by CI.

> Requires the `NPM_TOKEN` repository secret (a Verdaccio auth token) for the publish step.

## Contributing

Branching:

- `main` — production, tagged releases
- `development` — integration branch; run `pnpm release:prepare` here before merging to `main`
- `feat/*`, `fix/*`, `chore/*` — feature branches, PR into `development`

## License

Code in this repository is licensed under the [MIT License](./LICENSE) © Ricwolf19.

The `LICENSE` covers reusable code only. Documentation, branding (project name, logo, screenshots), and any non-code content are governed separately by the [NOTICE](./NOTICE) file and are **not** licensed for reuse under MIT.
