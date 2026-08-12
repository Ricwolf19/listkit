import { getSearchShortcut } from '../utils/shortcut'

/** Sections the help overlay groups shortcuts under. */
export type ShortcutGroup =
	| 'search'
	| 'filters'
	| 'view'
	| 'selection'
	| 'pagination'

/** Every action a list shortcut can trigger. */
export type ShortcutId =
	| 'focusSearch'
	| 'openFilters'
	| 'clearFilters'
	| 'removeLastFilter'
	| 'toggleView'
	| 'openExport'
	| 'refresh'
	| 'selectPage'
	| 'clearSelection'
	| 'prevPage'
	| 'nextPage'
	| 'firstPage'
	| 'lastPage'
	| 'showHelp'

/**
 * One shortcut, declared once and used twice: `match` drives the key handler,
 * `keys` renders it in the help overlay.
 *
 * Keeping both on the same object is the point — a shortcut that works but
 * isn't listed is undiscoverable, and one that's listed but doesn't work is
 * worse. Adding a shortcut means adding one entry here.
 */
export type ShortcutDef = {
	id: ShortcutId
	group: ShortcutGroup
	/** Chord as display tokens, e.g. `['⌘', 'K']`. Resolved per platform. */
	keys: () => string[]
	match: (event: KeyboardEvent) => boolean
}

/** True when the keystroke carries none of the chord modifiers. */
const bare = (e: KeyboardEvent) => !e.metaKey && !e.ctrlKey && !e.altKey

/** `Shift + <letter>`, the chord family used for list actions. */
const shift = (letter: string) => (e: KeyboardEvent) =>
	e.shiftKey && bare(e) && e.key.toLowerCase() === letter

/** A bare key with no modifiers at all (Shift included, for `+`/`?` layouts). */
const plain = (key: string) => (e: KeyboardEvent) => bare(e) && e.key === key

export const SHORTCUTS: ShortcutDef[] = [
	{
		id: 'focusSearch',
		group: 'search',
		keys: () => {
			const s = getSearchShortcut()
			return [s.modifier === 'metaKey' ? '⌘' : 'Ctrl', s.key.toUpperCase()]
		},
		match: e => {
			const s = getSearchShortcut()
			return e[s.modifier] && e.key.toLowerCase() === s.key
		},
	},
	{
		id: 'openFilters',
		group: 'filters',
		keys: () => ['+'],
		match: plain('+'),
	},
	{
		id: 'removeLastFilter',
		group: 'filters',
		keys: () => ['-'],
		match: plain('-'),
	},
	{
		id: 'clearFilters',
		group: 'filters',
		keys: () => ['Shift', 'C'],
		match: shift('c'),
	},
	{
		id: 'toggleView',
		group: 'view',
		keys: () => ['Shift', 'V'],
		match: shift('v'),
	},
	{
		id: 'openExport',
		group: 'view',
		keys: () => ['Shift', 'E'],
		match: shift('e'),
	},
	{
		id: 'refresh',
		group: 'view',
		keys: () => ['Shift', 'R'],
		match: shift('r'),
	},
	{
		id: 'selectPage',
		group: 'selection',
		keys: () => ['Shift', 'A'],
		match: shift('a'),
	},
	{
		id: 'clearSelection',
		group: 'selection',
		keys: () => ['Esc'],
		match: e => bare(e) && e.key === 'Escape',
	},
	{
		id: 'prevPage',
		group: 'pagination',
		keys: () => ['←'],
		match: e => bare(e) && !e.shiftKey && e.key === 'ArrowLeft',
	},
	{
		id: 'nextPage',
		group: 'pagination',
		keys: () => ['→'],
		match: e => bare(e) && !e.shiftKey && e.key === 'ArrowRight',
	},
	{
		id: 'firstPage',
		group: 'pagination',
		keys: () => ['Shift', '←'],
		match: e => bare(e) && e.shiftKey && e.key === 'ArrowLeft',
	},
	{
		id: 'lastPage',
		group: 'pagination',
		keys: () => ['Shift', '→'],
		match: e => bare(e) && e.shiftKey && e.key === 'ArrowRight',
	},
	{
		id: 'showHelp',
		group: 'view',
		keys: () => ['?'],
		match: plain('?'),
	},
]

/** Group order in the help overlay. */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
	'search',
	'filters',
	'view',
	'selection',
	'pagination',
]
