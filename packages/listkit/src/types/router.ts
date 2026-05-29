export type RouterAdapter = {
	get(key: string): string | null
	set(key: string, value: string | null): void
	/**
	 * Apply several param changes in a single navigation. Required for correct
	 * batch updates (e.g. applying filters + resetting the page): calling `set`
	 * repeatedly can clobber earlier writes on adapters that read a per-render
	 * snapshot of the query string (Next.js, React Router).
	 */
	setMany?(updates: Record<string, string | null>): void
}
