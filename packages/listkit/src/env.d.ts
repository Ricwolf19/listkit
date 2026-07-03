// Minimal ambient typing for the one build-time global the package reads:
// `process.env.NODE_ENV`, used to strip dev-only warnings from production
// bundles (webpack, Next, and tsup all statically replace it). Declared here
// instead of depending on `@types/node` so the package stays browser-scoped and
// free of Node globals it never actually uses at runtime.
declare const process: {
	env: {
		NODE_ENV?: 'development' | 'production' | 'test'
	}
}
