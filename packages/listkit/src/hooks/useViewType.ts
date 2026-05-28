import { useEffect, useRef, useState } from 'react'

import type { ViewType } from '../types/list'

const STORAGE_PREFIX = 'listkit:view:'

// Below this width (tablets and phones) cards are the default, since tables
// don't fit comfortably on narrow screens.
const TABLE_MIN_WIDTH = 1024

const getDeviceDefault = (): ViewType => {
	if (typeof window === 'undefined') return 'table'
	return window.innerWidth < TABLE_MIN_WIDTH ? 'cards' : 'table'
}

const readStored = (key: string): ViewType | null => {
	if (typeof window === 'undefined') return null
	const stored = window.localStorage.getItem(key)
	return stored === 'table' || stored === 'cards' ? stored : null
}

/**
 * Resolves the active view. Until the user toggles explicitly, it tracks device
 * width (cards on tablet/phone, table on desktop). Once the user picks a view it
 * is persisted to localStorage under `storageKey` and that choice wins, even
 * across resizes and future sessions.
 */
export function useViewType(storageKey?: string) {
	const key = STORAGE_PREFIX + (storageKey ?? 'default')

	const [viewType, setViewType] = useState<ViewType>(
		() => readStored(key) ?? getDeviceDefault()
	)
	const hasManualChoice = useRef(readStored(key) !== null)

	const handleViewChange = (next: ViewType) => {
		hasManualChoice.current = true
		setViewType(next)
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(key, next)
		}
	}

	useEffect(() => {
		const handleResize = () => {
			if (hasManualChoice.current) return
			setViewType(getDeviceDefault())
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	return { viewType, handleViewChange }
}
