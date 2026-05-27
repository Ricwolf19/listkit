export type RouterAdapter = {
	get(key: string): string | null
	set(key: string, value: string | null): void
}

export function nextRouterAdapter(): RouterAdapter {
	throw new Error(
		'nextRouterAdapter is not implemented yet — coming in v0.1.0'
	)
}
