import { DEMO_GROUPS } from './registry'

export type SidebarProps = {
	current: string
	onSelect: (id: string) => void
}

/**
 * Grouped demo nav. Fixed-width and independently scrollable so a long table to
 * its right never pushes it off-screen; collapses to a horizontal strip below
 * `lg`, where a permanent sidebar would eat the width the tables need.
 */
export function Sidebar({ current, onSelect }: SidebarProps) {
	return (
		// `sticky top-0` and not just `h-screen`: as a plain flex item the nav is
		// only as tall as the viewport but still scrolls away with the page, so a
		// long table leaves it stranded at the top.
		<nav className='shrink-0 border-b border-gray-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:self-start lg:overflow-y-auto lg:border-r lg:border-b-0'>
			<div className='border-b border-gray-100 px-5 py-4'>
				<h1 className='text-sm font-bold tracking-tight text-gray-900'>
					listkit playground
				</h1>
				<p className='mt-0.5 text-xs text-gray-500'>Entorno local de listkit</p>
			</div>

			<div className='flex gap-4 overflow-x-auto px-3 py-3 lg:block lg:space-y-5 lg:overflow-visible'>
				{DEMO_GROUPS.map(group => (
					<div key={group.title} className='shrink-0'>
						<h2 className='px-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase'>
							{group.title}
						</h2>
						<ul className='mt-1 flex gap-1 lg:mt-1.5 lg:block lg:space-y-0.5'>
							{group.demos.map(demo => {
								const active = demo.id === current
								return (
									<li key={demo.id}>
										<button
											type='button'
											onClick={() => onSelect(demo.id)}
											aria-current={active ? 'page' : undefined}
											className={`w-full cursor-pointer rounded-lg px-2.5 py-2 text-left transition-colors ${
												active
													? 'bg-gray-900 text-white'
													: 'text-gray-700 hover:bg-gray-100'
											}`}
										>
											<span className='block text-sm font-medium whitespace-nowrap'>
												{demo.label}
											</span>
											<span
												className={`mt-0.5 hidden text-xs lg:block ${
													active ? 'text-gray-300' : 'text-gray-500'
												}`}
											>
												{demo.blurb}
											</span>
										</button>
									</li>
								)
							})}
						</ul>
					</div>
				))}
			</div>
		</nav>
	)
}
