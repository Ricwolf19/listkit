/**
 * Coded developer diagnostics. Every code is documented in the README's
 * "Diagnostics" table — keep both in sync when adding one.
 *
 * Severities:
 * - `LK1xxx` (contract errors) — the config asks for something listkit cannot
 *   honor. {@link lkError} throws in development so the mistake surfaces before
 *   it ships, and is a no-op in production so bad data never crashes a page.
 * - `LK2xxx` (suspicious data) — handled by `warnDev` at the call site with the
 *   code in the message; deduped, warn-once.
 * - `LK3xxx` (limits reached) — surfaced in the UI, never just the console.
 */
export function lkError(code: string, message: string): void {
	if (process.env.NODE_ENV === 'production') return
	throw new Error(`[listkit ${code}] ${message}`)
}
