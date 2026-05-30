/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		{
			name: 'no-circular',
			severity: 'error',
			comment: 'Circular dependencies are forbidden.',
			from: {},
			to: { circular: true },
		},
		{
			name: 'no-orphans',
			severity: 'warn',
			comment:
				'Orphan modules (no imports, no exports used) are usually a smell.',
			from: {
				orphan: true,
				pathNot: [
					'(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',
					'\\.d\\.ts$',
					'(^|/)tsconfig\\.json$',
					'(^|/)(babel|webpack|vite|tsup|tailwind|postcss|eslint|prettier|knip|commitlint|\\.size-limit|\\.dependency-cruiser)\\.config\\.(js|cjs|mjs|ts|json)$',
					'packages/listkit/src/(index|next|react-router|adapters|server)\\.ts$',
					'playground/src/main\\.tsx$',
				],
			},
			to: {},
		},
		{
			name: 'no-deprecated-core',
			comment: 'Do not use deprecated Node.js core modules.',
			severity: 'warn',
			from: {},
			to: {
				dependencyTypes: ['core'],
				path: ['^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'],
			},
		},
		{
			name: 'not-to-dev-dep',
			severity: 'error',
			comment:
				'This module depends on a devDependency. Move it to dependencies.',
			from: {
				path: 'packages/listkit/src',
				pathNot: '\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$',
			},
			to: { dependencyTypes: ['npm-dev'] },
		},
		{
			name: 'router-adapters-stay-clean',
			severity: 'error',
			comment:
				'Router adapter entries (next.ts, react-router.ts) must only import from types/, not from components or other adapters.',
			from: { path: 'packages/listkit/src/(next|react-router)\\.ts$' },
			to: {
				path: 'packages/listkit/src',
				pathNot: 'packages/listkit/src/types/',
			},
		},
	],
	options: {
		doNotFollow: { path: ['node_modules', 'dist', 'build', '.vite'] },
		exclude: { path: ['node_modules', 'dist', 'build', '.vite', 'coverage'] },
		tsPreCompilationDeps: true,
		tsConfig: { fileName: 'tsconfig.base.json' },
		enhancedResolveOptions: {
			exportsFields: ['exports'],
			conditionNames: ['import', 'require', 'node', 'default', 'types'],
			mainFields: ['module', 'main', 'types'],
		},
		reporterOptions: {
			text: { highlightFocused: true },
		},
	},
}
