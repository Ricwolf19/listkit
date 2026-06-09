---
'@pibytelabs/listkit': patch
---

Search and filter matching are now accent- and case-insensitive. Quick search (in-memory adapter), advanced `text`/`select`/`multi-select` filters, the filter sidebar's quick-search, and searchable-select option lists all fold diacritics before comparing, so typing `jose` matches `José` and `arbol` matches `Árbol` — no need to type exact accents. (Server-side adapters still match per their own collation.)
