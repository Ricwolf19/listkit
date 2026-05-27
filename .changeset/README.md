# Changesets

This directory holds [changesets](https://github.com/changesets/changesets) — small markdown files describing changes for the next release.

## Workflow

1. Make a code change.
2. Run `pnpm changeset` and follow the prompts (which package, bump type, summary).
3. Commit the generated `.md` file alongside your code.
4. When releasing, run `pnpm changeset version` to consume all pending changesets, bump `package.json` versions, and update CHANGELOG files.
5. Tag and push — CI publishes to Verdaccio.
