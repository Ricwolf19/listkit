/**
 * Bridges list state (search, page, filters, sort) to a URL query string.
 * Provide one to {@link ListKitProvider} to sync state to the URL; omit it to
 * keep state in component-local React state.
 *
 * @remarks
 * Use a built-in adapter — {@link useNextRouterAdapter} (Next.js),
 * `useReactRouterAdapter` (React Router) or `useBrowserRouterAdapter` (History
 * API) — or implement this interface for a custom router.
 */
export type RouterAdapter = {
	/** Read a query-string param, or `null` when absent. */
	get(key: string): string | null
	/** Write a single param; `null`/`''` removes it. */
	set(key: string, value: string | null): void
	/**
	 * Apply several param changes in a single navigation. Required for correct
	 * batch updates (e.g. applying filters + resetting the page): calling `set`
	 * repeatedly can clobber earlier writes on adapters that read a per-render
	 * snapshot of the query string (Next.js, React Router).
	 */
	setMany?(updates: Record<string, string | null>): void
}
