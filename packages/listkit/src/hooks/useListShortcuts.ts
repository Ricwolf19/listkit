import { useEffect, useRef } from 'react'

import { getSearchShortcut } from '../utils/shortcut'

type Handlers = {
	onFocusSearch?: () => void
	onOpenFilters?: () => void
	onToggleView?: () => void
}

export function useListShortcuts(handlers: Handlers) {
	// Keep the latest handlers in a ref so the listener can be attached once
	// instead of re-subscribing on every render (callers pass inline arrows).
	const handlersRef = useRef(handlers)
	handlersRef.current = handlers

	useEffect(() => {
		const searchShortcut = getSearchShortcut()

		const handle = (e: KeyboardEvent) => {
			const { onFocusSearch, onOpenFilters, onToggleView } = handlersRef.current

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
				e.shiftKey &&
				!e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				e.key.toLowerCase() === 'f'
			) {
				e.preventDefault()
				onOpenFilters()
				return
			}

			// Toggle view: shift + v
			if (
				onToggleView &&
				!isEditable &&
				e.shiftKey &&
				!e.metaKey &&
				!e.ctrlKey &&
				!e.altKey &&
				e.key.toLowerCase() === 'v'
			) {
				e.preventDefault()
				onToggleView()
				return
			}
		}

		window.addEventListener('keydown', handle)
		return () => window.removeEventListener('keydown', handle)
	}, [])
}
