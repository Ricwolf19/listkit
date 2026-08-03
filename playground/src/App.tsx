import {
	ES_LABELS,
	ListKitProvider,
	useBrowserRouterAdapter,
} from '@pibytelabs/listkit'
import { useState } from 'react'

import { HelloListKit } from './examples/HelloListKit'
import { OrdersExample } from './examples/orders/OrdersExample'

const EXAMPLES = {
	products: {
		label: 'Productos (card propia)',
		render: () => <HelloListKit />,
	},
	orders: {
		label: 'Pedidos (auto-card)',
		render: () => <OrdersExample />,
	},
} as const

export function App() {
	const [example, setExample] = useState<keyof typeof EXAMPLES>('products')
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
							'options menu → density · columns · export',
							'columns → reveal default-hidden (Proveedor, Origen, …)',
							'CSV export → page or all',
							'row selection + bulk actions',
							'export selected',
							'sticky header (scrolls with the page)',
							'drag headers to reorder',
							'drag column edges to resize',
							'lazy <ListImage> thumbnails',
							'Shift + ←/→ → first / last page',
							'header slots',
							'default filter (En stock)',
							'open filters → press +',
							'remove last filter → press -',
							'filter quick-search (6+ filters)',
							'collapsible sections (Origen / Otros)',
							'range sliders (Precio / Calificación)',
							'Shift+V toggle view',
							'3.0 · features on by default (no flags)',
							'3.0 · auto-card from the columns (Pedidos)',
							'3.0 · resize under 1024px → cards',
							'3.0 · defaultSort (Nombre ↑)',
							'3.0 · pinned filter chips',
							'3.0 · adapter key → per-scope cache (Pedidos)',
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
				<nav className='mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm'>
					{Object.entries(EXAMPLES).map(([key, value]) => (
						<button
							key={key}
							onClick={() => setExample(key as keyof typeof EXAMPLES)}
							className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
								example === key
									? 'bg-gray-900 text-white'
									: 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							{value.label}
						</button>
					))}
				</nav>

				<main>{EXAMPLES[example].render()}</main>
			</div>
		</ListKitProvider>
	)
}
