import { Rows3, Rows4 } from 'lucide-react'

import { useLabels } from '../context/ListKitContext'
import type { Density } from '../types/list'
import { cn } from '../utils/cn'

/** Props for {@link DensityToggle}. */
export type DensityToggleProps = {
	/** Current density. */
	density: Density
	/** Called with the next density when toggled. */
	onChange: (density: Density) => void
}

/**
 * Toolbar button that flips table rows between comfortable and compact density.
 * Rendered by `<ListView>` when `table.density` is set; the choice persists.
 */
export function DensityToggle({ density, onChange }: DensityToggleProps) {
	const labels = useLabels()
	const compact = density === 'compact'
	const next: Density = compact ? 'comfortable' : 'compact'
	const title = `${labels.density}: ${compact ? labels.densityCompact : labels.densityComfortable}`

	return (
		<button
			type='button'
			onClick={() => onChange(next)}
			title={title}
			aria-label={title}
			className={cn(
				'flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50'
			)}
		>
			{compact ? <Rows4 className='h-4 w-4' /> : <Rows3 className='h-4 w-4' />}
		</button>
	)
}
