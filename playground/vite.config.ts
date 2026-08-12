import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const pkg = (sub: string) =>
	fileURLToPath(new URL(`../packages/listkit/src/${sub}`, import.meta.url))

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		/**
		 * Resolve the package to its **source**, not `dist`.
		 *
		 * `pnpm dev` runs tsup's watcher and this server in parallel, and tsup
		 * cleans `dist` on start — so through the package `exports` Vite can hit an
		 * empty directory and fail with "Failed to resolve entry for package". The
		 * alias removes the race entirely and makes edits hot-reload straight from
		 * source, with no build round-trip.
		 *
		 * Subpaths are listed explicitly (and before the bare specifier) because
		 * the alias array matches in order and a plain prefix would also swallow
		 * `listkit/tailwind.css`.
		 */
		alias: [
			{
				find: 'listkit/react-router',
				replacement: pkg('react-router.ts'),
			},
			{ find: 'listkit/adapters', replacement: pkg('adapters.ts') },
			{
				find: 'listkit/react-query',
				replacement: pkg('react-query.ts'),
			},
			{ find: 'listkit/server', replacement: pkg('server.ts') },
			{ find: 'listkit/query', replacement: pkg('query.ts') },
			{ find: /^listkit$/, replacement: pkg('index.ts') },
		],
	},
	server: {
		port: 5173,
		open: true,
	},
})
