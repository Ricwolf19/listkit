/** Names of the built-in surface-tone presets. */
export type BuiltInSurfaceTone = 'gray' | 'slate' | 'zinc' | 'contrast'

/**
 * The neutral chrome of the table and the default cards, as Tailwind class
 * strings — surfaces, header, dividers, row states. Accents (buttons, chips,
 * focus rings) are a separate axis: {@link ColorTheme}.
 *
 * Every background here must stay opaque: pinned cells paint with
 * `bg-inherit`, and any alpha lets scrolled content show through them
 * (AGENTS.md section 8, invariant 15). Each string carries its own `dark:`
 * siblings.
 */
export type SurfaceTones = {
	/** Panel around the table and each default card: border color, bg, shadow. */
	container: string
	/** Header cells' background — opaque, also used for pinned header cells. */
	headerBg: string
	/** Header label text. */
	headerText: string
	/** The header's bottom rule — the table's one strong horizontal line. */
	headerDivider: string
	/** Row background at rest — opaque; pinned body cells inherit it. */
	rowBg: string
	rowHover: string
	rowSelected: string
	/** Row dividers (`divide-*` color). */
	divider: string
}

const tones: Record<BuiltInSurfaceTone, SurfaceTones> = {
	gray: {
		container:
			'border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900',
		headerBg: 'bg-gray-50 dark:bg-gray-800',
		headerText: 'text-gray-600 dark:text-gray-400',
		headerDivider: 'border-gray-300 dark:border-gray-600',
		rowBg: 'bg-white dark:bg-gray-900',
		rowHover: 'hover:bg-gray-50 dark:hover:bg-gray-800',
		rowSelected:
			'bg-gray-100 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700',
		divider: 'divide-gray-100 dark:divide-gray-800',
	},
	slate: {
		container:
			'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
		headerBg: 'bg-slate-50 dark:bg-slate-800',
		headerText: 'text-slate-600 dark:text-slate-400',
		headerDivider: 'border-slate-300 dark:border-slate-600',
		rowBg: 'bg-white dark:bg-slate-900',
		rowHover: 'hover:bg-slate-50 dark:hover:bg-slate-800',
		rowSelected:
			'bg-slate-100 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-700',
		divider: 'divide-slate-100 dark:divide-slate-800',
	},
	zinc: {
		container:
			'border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
		headerBg: 'bg-zinc-50 dark:bg-zinc-800',
		headerText: 'text-zinc-600 dark:text-zinc-400',
		headerDivider: 'border-zinc-300 dark:border-zinc-600',
		rowBg: 'bg-white dark:bg-zinc-900',
		rowHover: 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
		rowSelected:
			'bg-zinc-100 hover:bg-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-700',
		divider: 'divide-zinc-100 dark:divide-zinc-800',
	},
	// An inverted header over plain rows — the "report" look.
	contrast: {
		container:
			'border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900',
		headerBg: 'bg-gray-900 dark:bg-gray-950',
		headerText: 'text-gray-300 dark:text-gray-400',
		headerDivider: 'border-gray-900 dark:border-gray-950',
		rowBg: 'bg-white dark:bg-gray-900',
		rowHover: 'hover:bg-gray-50 dark:hover:bg-gray-800',
		rowSelected:
			'bg-gray-100 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700',
		divider: 'divide-gray-100 dark:divide-gray-800',
	},
}

/** The preset used when a config sets none. */
export const DEFAULT_SURFACE_TONE: BuiltInSurfaceTone = 'gray'

/**
 * Resolve a preset name or a full {@link SurfaceTones} object to its classes.
 */
export function getSurfaceTones(
	tone: BuiltInSurfaceTone | SurfaceTones = DEFAULT_SURFACE_TONE
): SurfaceTones {
	if (typeof tone === 'object') return tone
	return tones[tone] ?? tones[DEFAULT_SURFACE_TONE]
}
