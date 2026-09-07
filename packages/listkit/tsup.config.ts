import { defineConfig, type Options } from 'tsup'

// Two build groups, one toolchain. They split over whether the output opens
// with `'use client'`, and everything else about them follows from that.
//
// esbuild drops per-file directives, so the boundary can only ship as a
// banner on the entries that need it. Without it a Next.js App Router consumer cannot import
// a value from the main entry inside any module the server evaluates — a
// shared list config, say — because the import evaluates `createContext`
// server-side. The banner turns each export into a client reference instead,
// which is what a plain React app already gets for free and what RSC needs
// spelled out. Consumer bundlers still tree-shake through `sideEffects: false`.
//
// The server-safe entries must NOT carry it (AGENTS.md invariant 4): they run
// in RSC, route handlers and Node backends, where the directive would be a
// lie and, under some bundlers, an error. `adapters` imports no React and
// serves both sides, so it stays neutral as well.
//
// `pnpm check:client-boundary` asserts both halves against the built `dist`.
const shared: Options = {
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	// Both groups write to the same `dist` and tsup runs them in parallel, so a
	// `clean` on either races the other's output. The build script cleans first.
	clean: false,
	target: 'es2022',
	external: [
		'react',
		'react-dom',
		'react/jsx-runtime',
		'lucide-react',
		'next/navigation',
		'next/router',
		'react-router-dom',
		'react-router',
		'react-datepicker',
		'@tanstack/react-query',
		'mongoose',
	],
}

export default defineConfig([
	{
		...shared,
		entry: {
			index: 'src/index.ts',
			next: 'src/next.tsx',
			'react-router': 'src/react-router.ts',
			'react-query': 'src/react-query.ts',
		},
		// Off, and not optional: rollup — which is what `treeshake` runs — strips
		// module-level directives, so treeshaking silently deletes the banner
		// above and leaves every unit test green. Measured cost of keeping it:
		// 0.79 kB on the main entry.
		treeshake: false,
		// Keep styles injection so consumers don't need to import any CSS.
		injectStyle: true,
		banner: { js: "'use client'" },
	},
	{
		...shared,
		entry: {
			adapters: 'src/adapters.ts',
			server: 'src/server.ts',
			query: 'src/query.ts',
			sql: 'src/sql.ts',
			mongo: 'src/mongo.ts',
			mongoose: 'src/mongoose.ts',
		},
		treeshake: true,
	},
])
