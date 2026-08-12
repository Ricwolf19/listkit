import { ES_LABELS, ListKitProvider, useBrowserRouterAdapter } from 'listkit'
import { useState } from 'react'

import { DEFAULT_DEMO_ID, DEMOS } from './shell/registry'
import { Sidebar } from './shell/Sidebar'

const DEMO_PARAM = 'demo'

const demoFromUrl = () => {
	const id = new URLSearchParams(window.location.search).get(DEMO_PARAM)
	return DEMOS.some(demo => demo.id === id) ? id! : DEFAULT_DEMO_ID
}

/**
 * Switch demos and drop every other query param.
 *
 * Each list owns the same param names (`search`, `page`, `f_*`), so carrying
 * them across would apply the tickets list's filters to the invoices list and
 * open a demo on an empty, already-filtered table — which reads as a bug in
 * listkit rather than as leftover state.
 */
const selectDemo = (id: string) => {
	window.history.replaceState(null, '', `?${DEMO_PARAM}=${id}`)
}

export function App() {
	const [demoId, setDemoId] = useState(demoFromUrl)
	// Sync list state (search, page, filters) to the URL with the built-in
	// framework-free adapter — no Next.js / React Router needed.
	const router = useBrowserRouterAdapter()

	const demo = DEMOS.find(d => d.id === demoId) ?? DEMOS[0]!
	const Demo = demo.render

	return (
		<ListKitProvider router={router} labels={ES_LABELS}>
			<div className='min-h-screen bg-gray-50 lg:flex'>
				<Sidebar
					current={demo.id}
					onSelect={id => {
						selectDemo(id)
						setDemoId(id)
					}}
				/>
				{/* `min-w-0` so a wide table scrolls inside this column instead of
				    stretching the flex row and pushing the sidebar off-screen. */}
				<main className='min-w-0 flex-1 p-6 lg:p-8'>
					<Demo key={demo.id} />
				</main>
			</div>
		</ListKitProvider>
	)
}
