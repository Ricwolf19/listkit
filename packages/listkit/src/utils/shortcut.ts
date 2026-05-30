type SearchShortcut = {
	key: string
	modifier: 'metaKey' | 'ctrlKey'
	display: string
}

export function getSearchShortcut(): SearchShortcut {
	if (typeof navigator === 'undefined') {
		return { key: 'k', modifier: 'ctrlKey', display: 'Ctrl K' }
	}
	const isMac = /mac/i.test(navigator.userAgent)
	return isMac
		? { key: 'k', modifier: 'metaKey', display: '⌘ K' }
		: { key: 'k', modifier: 'ctrlKey', display: 'Ctrl K' }
}

export function formatShortcutTitle(label: string, keys: string): string {
	return `${label} (${keys})`
}
