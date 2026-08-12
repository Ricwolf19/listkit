import type { ReactNode } from 'react'

/** One thing a reviewer should actually go do in this demo. */
export type Legend = {
	/** The gesture — "Scrollea a la derecha", "Shift + V". */
	action: string
	/** What to look for once they do it. */
	expect: string
}

export type ExampleShellProps = {
	title: string
	subtitle: string
	/** What to try, and what should happen. Rendered above the list. */
	legends: Legend[]
	/** Per-demo toggles (dataset scope, pagination variant, theme…). */
	controls?: ReactNode
	children: ReactNode
}

/**
 * Frame around every demo: heading, its own "what to try" legend, an optional
 * control strip, then the list. The legend lives here rather than in a global
 * banner because a hint only means anything next to the list it describes.
 */
export function ExampleShell({
	title,
	subtitle,
	legends,
	controls,
	children,
}: ExampleShellProps) {
	return (
		<div className='flex min-h-full flex-col gap-5'>
			<header>
				<h2 className='text-2xl font-bold tracking-tight text-gray-900'>
					{title}
				</h2>
				<p className='mt-1 text-sm text-gray-600'>{subtitle}</p>
			</header>

			{legends.length > 0 && (
				<section className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
					<h3 className='text-xs font-semibold tracking-wide text-gray-500 uppercase'>
						Qué probar
					</h3>
					<ul className='mt-2.5 grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-3'>
						{legends.map(legend => (
							<li
								key={legend.action}
								className='flex gap-2 text-sm leading-snug'
							>
								<span
									aria-hidden
									className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300'
								/>
								<span>
									<span className='font-medium text-gray-900'>
										{legend.action}
									</span>{' '}
									<span className='text-gray-500'>{legend.expect}</span>
								</span>
							</li>
						))}
					</ul>
				</section>
			)}

			{controls && (
				<div className='flex flex-wrap items-center gap-3'>{controls}</div>
			)}

			<div className='min-w-0 flex-1'>{children}</div>
		</div>
	)
}
