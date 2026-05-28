export type RouterAdapter = {
	get(key: string): string | null
	set(key: string, value: string | null): void
}
