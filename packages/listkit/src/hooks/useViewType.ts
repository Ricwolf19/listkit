import { useEffect, useState } from 'react'

import type { ViewType } from '../types/list'

const getDefaultView = (): ViewType => {
	if (typeof window === 'undefined') return 'table'
	return window.innerWidth < 768 ? 'cards' : 'table'
}

export function useViewType() {
	const [viewType, setViewType] = useState<ViewType>(getDefaultView)
	const [userOverride, setUserOverride] = useState(false)

	const handleViewChange = (next: ViewType) => {
		setUserOverride(true)
		setViewType(next)
	}

	useEffect(() => {
		if (userOverride) return
		const handleResize = () => {
			setViewType(window.innerWidth < 768 ? 'cards' : 'table')
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [userOverride])

	return { viewType, handleViewChange }
}
