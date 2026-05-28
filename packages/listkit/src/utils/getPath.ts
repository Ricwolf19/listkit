export function getPath(obj: unknown, path: string): unknown {
	return path
		.split('.')
		.reduce<unknown>(
			(acc, key) => (acc == null ? acc : (acc as Record<string, unknown>)[key]),
			obj
		)
}
