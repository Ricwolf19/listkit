/**
 * Imports every server-safe subpath the way a TypeScript backend does, and
 * asserts a known export is actually callable.
 *
 * Run under `tsx` on purpose. A TS-aware loader resolves differently from plain
 * `node` — it honors tsconfig `paths` and can match a `types` condition — and
 * either can hand back a declaration file, which transpiles to an empty module.
 * The import still "succeeds", so every named binding is silently `undefined`;
 * only touching one catches it. Vitest cannot cover this: it never goes through
 * that loader.
 *
 * Usage: `pnpm check:subpaths`
 */
const CHECKS = [
	{ subpath: '@pibytelabs/listkit/query', name: 'parseListkitQuery' },
	{ subpath: '@pibytelabs/listkit/mongo', name: 'buildMongoSort' },
	{ subpath: '@pibytelabs/listkit/mongo', name: 'executeMongoList' },
	{
		subpath: '@pibytelabs/listkit/mongoose',
		name: 'executePaginatedListkitQuery',
	},
	{ subpath: '@pibytelabs/listkit/sql', name: 'buildSqlFilter' },
	{ subpath: '@pibytelabs/listkit/server', name: 'buildListQuery' },
	{ subpath: '@pibytelabs/listkit/adapters', name: 'encodeListQuery' },
] as const

const failures: string[] = []

for (const { subpath, name } of CHECKS) {
	try {
		const module: Record<string, unknown> = await import(subpath)
		const exported = module[name]
		if (typeof exported !== 'function') {
			const keys = Object.keys(module)
			failures.push(
				`${subpath} → "${name}" is ${typeof exported}` +
					(keys.length === 0
						? ' (module has NO exports — a .d.ts was loaded instead of the .js)'
						: ` (exports: ${keys.slice(0, 6).join(', ')}…)`)
			)
		}
	} catch (error) {
		failures.push(`${subpath} → import threw: ${(error as Error).message}`)
	}
}

if (failures.length > 0) {
	console.error('Subpath check failed under a TypeScript-aware runtime:\n')
	for (const failure of failures) console.error(`  ✖ ${failure}`)
	process.exit(1)
}

console.log(
	`✔ ${CHECKS.length} subpath imports resolve to real modules under tsx`
)
