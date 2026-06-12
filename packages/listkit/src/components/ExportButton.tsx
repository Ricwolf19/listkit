import { Download, FileDown, Loader2, Table2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useLabels } from '../context/ListKitContext'
import { type ColorTheme, getColorTheme } from '../theme/colorTheme'
import { cn } from '../utils/cn'

/** Props for {@link ExportButton}. */
export type ExportButtonProps = {
	/** Export the rows currently on screen. */
	onExportPage: () => void
	/** Export every matching row. When omitted, the button exports the page directly. */
	onExportAll?: () => void
	/** Disables the control and shows a spinner (e.g. server-side export in flight). */
	exporting?: boolean
	colorTheme?: ColorTheme
}

const triggerClass =
	'flex h-10 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'

/**
 * Toolbar CSV-export control. With only {@link ExportButtonProps.onExportPage}
 * it's a single button; when {@link ExportButtonProps.onExportAll} is given it
 * opens a menu offering current-page vs. all.
 */
export function ExportButton({
	onExportPage,
	onExportAll,
	exporting = false,
	colorTheme = 'red',
}: ExportButtonProps) {
	const labels = useLabels()
	const theme = getColorTheme(colorTheme)
	const [open, setOpen] = useState(false)
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const onPointer = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false)
		}
		document.addEventListener('mousedown', onPointer)
		document.addEventListener('keydown', onKey)
		return () => {
			document.removeEventListener('mousedown', onPointer)
			document.removeEventListener('keydown', onKey)
		}
	}, [open])

	const icon = exporting ? (
		<Loader2 className='h-4 w-4 animate-spin' />
	) : (
		<Download className='h-4 w-4' />
	)

	if (!onExportAll) {
		return (
			<button
				type='button'
				onClick={onExportPage}
				disabled={exporting}
				title={labels.exportData}
				aria-label={labels.exportData}
				className={cn(triggerClass, 'w-10 cursor-pointer px-0')}
			>
				{icon}
			</button>
		)
	}

	const item =
		'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50'

	return (
		<div className='relative' ref={ref}>
			<button
				type='button'
				onClick={() => setOpen(o => !o)}
				disabled={exporting}
				title={labels.exportData}
				aria-label={labels.exportData}
				aria-expanded={open}
				className={cn(triggerClass, 'cursor-pointer')}
			>
				{icon}
				<span className='hidden text-sm font-medium sm:inline'>
					{exporting ? labels.exporting : labels.exportData}
				</span>
			</button>

			{open && !exporting && (
				<div className='absolute right-0 z-40 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl'>
					<button
						type='button'
						className={item}
						onClick={() => {
							setOpen(false)
							onExportPage()
						}}
					>
						<Table2 className={cn('h-4 w-4', theme.accentText)} />
						{labels.exportCurrentPage}
					</button>
					<button
						type='button'
						className={item}
						onClick={() => {
							setOpen(false)
							onExportAll()
						}}
					>
						<FileDown className={cn('h-4 w-4', theme.accentText)} />
						{labels.exportAll}
					</button>
				</div>
			)}
		</div>
	)
}
