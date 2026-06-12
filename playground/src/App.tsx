import {
	ES_LABELS,
	ListKitProvider,
	useBrowserRouterAdapter,
} from '@pibytelabs/listkit'

import { HelloListKit } from './examples/HelloListKit'

export function App() {
	// Sync list state (search, page, filters) to the URL with the built-in
	// framework-free adapter — no Next.js / React Router needed.
	const router = useBrowserRouterAdapter()

	return (
		<ListKitProvider router={router} labels={ES_LABELS}>
			<div className='min-h-screen bg-gray-50 p-8'>
				<header className='mb-8'>
					<h1 className='text-3xl font-bold text-gray-900'>
						listkit playground
					</h1>
					<p className='mt-1 text-gray-600'>
						Local development environment for @pibytelabs/listkit
					</p>
					<div className='mt-3 flex flex-wrap gap-2 text-xs'>
						{[
							'CSV export → page or all',
							'row selection + bulk actions',
							'export selected',
							'sticky header',
							'density toggle (comfortable / compact)',
							'drag headers to reorder',
							'drag column edges to resize',
							'lazy <ListImage> thumbnails',
							'column manager → drag rows to reorder + check to hide',
							'header slots',
							'default filter (En stock)',
							'open filters → press +',
							'remove last filter → press -',
							'filter quick-search (6+ filters)',
							'collapsible sections (Origen / Otros)',
							'range sliders (Precio / Calificación)',
							'Shift+V toggle view',
						].map(hint => (
							<span
								key={hint}
								className='rounded-full border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-600'
							>
								{hint}
							</span>
						))}
					</div>
				</header>
				<main>
					<HelloListKit />
				</main>
			</div>
		</ListKitProvider>
	)
}
