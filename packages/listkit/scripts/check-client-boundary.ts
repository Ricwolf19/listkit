/**
 * Asserts the published client/server boundary: every entry a React app
 * imports opens with `'use client'`, and no server-safe entry does.
 *
 * Reads `dist`, so it runs after the build like `check-subpaths`. Vitest
 * cannot cover this — it exercises `src`, where the directive does not exist:
 * the banner is applied at bundle time. Turning `treeshake` back on strips it
 * (rollup drops module-level directives) while every unit test and `tsc` stay
 * green, so nothing else in the gate would notice a Next.js App Router
 * consumer breaking.
 *
 * Usage: `pnpm check:client-boundary`
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Entries that render or hold React state — they own the client boundary. */
const CLIENT_ENTRIES = ['index', 'next', 'react-router', 'react-query'] as const
/** Server-safe entries: RSC, route handlers, Node. @see AGENTS.md invariant 4 */
const SERVER_ENTRIES = [
	'adapters',
	'server',
	'query',
	'sql',
	'mongo',
	'mongoose',
] as const

// The banner is applied per format, so a regression can land in one and not
// the other — check both rather than trusting ESM to speak for CJS.
const FORMATS = [
	{ ext: 'js', label: 'ESM' },
	{ ext: 'cjs', label: 'CJS' },
] as const

const DIST = new URL('../dist/', import.meta.url).pathname

/**
 * Whether the module's FIRST statement is the directive. Position is the whole
 * point: a `'use client'` that lands after an import is an inert string
 * literal, and bundlers ignore it without complaining.
 */
const opensWithDirective = (source: string): boolean =>
	/^\s*(['"])use client\1/.test(source)

const failures: string[] = []

for (const { ext, label } of FORMATS) {
	for (const entry of CLIENT_ENTRIES) {
		const file = join(DIST, `${entry}.${ext}`)
		try {
			if (!opensWithDirective(readFileSync(file, 'utf8'))) {
				failures.push(
					`${entry}.${ext} (${label}) does not open with 'use client' — ` +
						`importing it from a server-evaluated module will crash the RSC render`
				)
			}
		} catch {
			failures.push(
				`${entry}.${ext} (${label}) is missing — run the build first`
			)
		}
	}

	for (const entry of SERVER_ENTRIES) {
		const file = join(DIST, `${entry}.${ext}`)
		try {
			if (opensWithDirective(readFileSync(file, 'utf8'))) {
				failures.push(
					`${entry}.${ext} (${label}) opens with 'use client' — this entry runs ` +
						`in RSC and Node backends, where the directive is a lie`
				)
			}
		} catch {
			failures.push(
				`${entry}.${ext} (${label}) is missing — run the build first`
			)
		}
	}
}

if (failures.length > 0) {
	console.error('Client/server boundary check failed:\n')
	for (const failure of failures) console.error(`  ✖ ${failure}`)
	process.exit(1)
}

console.log(
	`✔ ${CLIENT_ENTRIES.length} client entries carry 'use client' and ` +
		`${SERVER_ENTRIES.length} server-safe entries do not (ESM + CJS)`
)
