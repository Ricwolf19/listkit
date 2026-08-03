const seen = new Set<string>()

/**
 * Logs a warning once per `key`, in development only.
 *
 * Used on paths that run per request or per row, where the same misconfiguration
 * would otherwise print thousands of times and bury everything else. `message`
 * arrives already prefixed by the caller.
 */
export function warnDev(key: string, message: string): void {
	if (process.env.NODE_ENV === 'production') return
	if (seen.has(key)) return
	seen.add(key)
	console.warn(message)
}
