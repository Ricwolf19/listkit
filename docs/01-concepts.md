# Concepts

> Placeholder — expands with each phase.

## The mental model

A **list view** in listkit is a composed page that combines:

1. A **toolbar** (search input, view toggle, custom action buttons)
2. A **data display** (table on desktop, cards on mobile, toggleable)
3. **Pagination**
4. Optional **advanced filters** (sidebar / panel)
5. Optional **portals** (related modals like create/edit/delete dialogs)

You describe all of this in one config object via `defineListConfig<T>()` and pass it to `<ListView>`.

## `defineListConfig<T>()`

(Coming in v0.1.0.) Returns a typed config consumed by `<ListView>`. Consolidates what used to be 4–5 functions in the legacy `generic-list` block.

## Router adapter

URL query params (`?page=2&search=hello`) drive state. Because Next.js and React Router have incompatible APIs, listkit accepts a pluggable `RouterAdapter`. See [Adapters](./02-adapters.md).

## Data adapter

(Coming in v1.0.0.) Listkit doesn't fetch data directly — it asks a `DataAdapter` for paginated/filtered/searched slices. Built-in adapters cover in-memory arrays and REST APIs; custom adapters handle anything else.
