import { defineConfig } from 'tsup'

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		next: 'src/next.ts',
		'react-router': 'src/react-router.ts',
		adapters: 'src/adapters.ts',
	},
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	treeshake: true,
	target: 'es2022',
	// Keep styles injection so consumers don't need to import any CSS.
	injectStyle: true,
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
		'zod',
	],
})
