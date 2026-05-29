---
'@pibytelabs/listkit': minor
---

Date-range filters now use react-datepicker (calendar with month/year dropdowns
and optional time) instead of the native date input. react-datepicker is a
bundled dependency kept external from the JS bundle; its stylesheet is injected
at runtime via tsup `injectStyle` (SSR-safe), so consumers import no CSS.
