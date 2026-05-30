import { useEffect } from 'react'

import { getSearchShortcut } from '../utils/shortcut'

type Handlers = {
	onFocusSearch?: () => void
	onOpenFilters?: () => void
	onToggleView?: () => void
}

export function useListShortcuts({
	onFocusSearch,
	onOpenFilters,
	onToggleView,
}: Handlers) {
	useEffect(() => {
		const searchShortcut = getSearchShortcut()

		const handle = (e: KeyboardEvent) => {
			// Skip if the user is typing inside an input/textarea/select
			const target = e.target as HTMLElement
			const tag = target.tagName.toLowerCase()
			const isEditable =
				target.isContentEditable ||
				tag === 'input' ||
				tag === 'textarea' ||
				tag === 'select'

			// Search focus: meta/ctrl + k
			if (
				onFocusSearch &&
				!isEditable &&
				e[searchShortcut.modifier] &&
				e.key.toLowerCase() === searchShortcut.key
			) {
				e.preventDefault()
				onFocusSearch()
				return
			}

			// Open filters: shift + f
			if (
				onOpenFilters &&
				!isEditable &&
				!e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				(e.key === 'f' || e.key === 'F')
			) {
				e.preventDefault()
				onOpenFilters()
				return
			}

			// Toggle view: shift + v
			if (
				onToggleView &&
				!isEditable &&
				!e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				(e.key === 'v' || e.key === 'V')
			) {
				e.preventDefault()
				onToggleView()
				return
			}
		}

		window.addEventListener('keydown', handle)
		return () => window.removeEventListener('keydown', handle)
	}, [onFocusSearch, onOpenFilters, onToggleView])
}
