/** Names of the built-in color palettes. */
export type BuiltInColorTheme =
	| 'blue'
	| 'red'
	| 'green'
	| 'yellow'
	| 'purple'
	| 'pink'
	| 'orange'
	| 'teal'

/**
 * A fully custom theme: Tailwind class strings for each themed surface. Pass it
 * as a {@link ColorTheme} to brand a list without using a built-in palette.
 */
export type ThemeClasses = {
	focusRing: string
	focusBorder: string
	primaryBg: string
	primaryText: string
	primaryHover: string
	paginationSpinnerBorder: string
	viewToggleActiveBg: string
	viewToggleActiveText: string
	viewToggleActiveShadow: string
	/** Active-filter chips. */
	chipBg: string
	chipBorder: string
	chipText: string
	/** Soft tinted hover for neutral controls (pagination arrows, etc.). */
	softHoverBg: string
	/** Themed accent text. */
	accentText: string
}

/**
 * A built-in palette name, or a full `ThemeClasses` object for a custom theme.
 * Pass the object via `config.colorTheme` or `<ListKitProvider theme={…}>` to
 * use brand colors without touching the built-ins.
 */
export type ColorTheme = BuiltInColorTheme | ThemeClasses

const themes: Record<BuiltInColorTheme, ThemeClasses> = {
	blue: {
		focusRing: 'focus:ring-blue-500',
		focusBorder: 'focus:border-blue-500',
		primaryBg: 'bg-blue-600',
		primaryText: 'text-white',
		primaryHover: 'hover:bg-blue-700',
		paginationSpinnerBorder: 'border-t-blue-600',
		viewToggleActiveBg: 'bg-blue-600',
		viewToggleActiveText: 'text-white',
		viewToggleActiveShadow: 'shadow-sm',
		chipBg: 'bg-blue-50 dark:bg-blue-950/40',
		chipBorder: 'border-blue-200 dark:border-blue-900',
		chipText: 'text-blue-700 dark:text-blue-300',
		softHoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-950/40',
		accentText: 'text-blue-600 dark:text-blue-400',
	},
	red: {
		focusRing: 'focus:ring-red-500',
		focusBorder: 'focus:border-red-500',
		primaryBg: 'bg-red-600',
		primaryText: 'text-white',
		primaryHover: 'hover:bg-red-700',
		paginationSpinnerBorder: 'border-t-red-600',
		viewToggleActiveBg: 'bg-red-600',
		viewToggleActiveText: 'text-white',
		viewToggleActiveShadow: 'shadow-sm',
		chipBg: 'bg-red-50 dark:bg-red-950/40',
		chipBorder: 'border-red-200 dark:border-red-900',
		chipText: 'text-red-700 dark:text-red-300',
		softHoverBg: 'hover:bg-red-50 dark:hover:bg-red-950/40',
		accentText: 'text-red-600 dark:text-red-400',
	},
	green: {
		focusRing: 'focus:ring-green-500',
		focusBorder: 'focus:border-green-500',
		primaryBg: 'bg-green-600',
		primaryText: 'text-white',
		primaryHover: 'hover:bg-green-700',
		paginationSpinnerBorder: 'border-t-green-600',
		viewToggleActiveBg: 'bg-green-600',
		viewToggleActiveText: 'text-white',
		viewToggleActiveShadow: 'shadow-sm',
		chipBg: 'bg-green-50 dark:bg-green-950/40',
		chipBorder: 'border-green-200 dark:border-green-900',
		chipText: 'text-green-700 dark:text-green-300',
		softHoverBg: 'hover:bg-green-50 dark:hover:bg-green-950/40',
		accentText: 'text-green-600 dark:text-green-400',
	},
	yellow: {
		focusRing: 'focus:ring-yellow-500',
		focusBorder: 'focus:border-yellow-500',
		primaryBg: 'bg-yellow-500',
		primaryText: 'text-yellow-900',
		primaryHover: 'hover:bg-yellow-600',
		paginationSpinnerBorder: 'border-t-yellow-500',
		viewToggleActiveBg: 'bg-yellow-500',
		viewToggleActiveText: 'text-yellow-900',
		viewToggleActiveShadow: 'shadow-sm',
		chipBg: 'bg-yellow-50 dark:bg-yellow-950/40',
		chipBorder: 'border-yellow-200 dark:border-yellow-900',
		chipText: 'text-yellow-800 dark:text-yellow-300',
		softHoverBg: 'hover:bg-yellow-50 dark:hover:bg-yellow-950/40',
		accentText: 'text-yellow-700 dark:text-yellow-400',
	},
	purple: {
		focusRing: 'focus:ring-purple-500',
		focusBorder: 'focus:border-purple-500',
		primaryBg: 'bg-purple-600',
		primaryText: 'text-white',
		primaryHover: 'hover:bg-purple-700',
		paginationSpinnerBorder: 'border-t-purple-600',
		viewToggleActiveBg: 'bg-purple-600',
		viewToggleActiveText: 'text-white',
		viewToggleActiveShadow: 'shadow-sm',
		chipBg: 'bg-purple-50 dark:bg-purple-950/40',
		chipBorder: 'border-purple-200 dark:border-purple-900',
		chipText: 'text-purple-700 dark:text-purple-300',
		softHoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950/40',
		accentText: 'text-purple-600 dark:text-purple-400',
	},
	pink: {
		focusRing: 'focus:ring-pink-500',
		focusBorder: 'focus:border-pink-500',
		primaryBg: 'bg-pink-600',
		primaryText: 'text-white',
		primaryHover: 'hover:bg-pink-700',
		paginationSpinnerBorder: 'border-t-pink-600',
		viewToggleActiveBg: 'bg-pink-600',
		viewToggleActiveText: 'text-white',
		viewToggleActiveShadow: 'shadow-sm',
		chipBg: 'bg-pink-50 dark:bg-pink-950/40',
		chipBorder: 'border-pink-200 dark:border-pink-900',
		chipText: 'text-pink-700 dark:text-pink-300',
		softHoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-950/40',
		accentText: 'text-pink-600 dark:text-pink-400',
	},
	orange: {
		focusRing: 'focus:ring-orange-500',
		focusBorder: 'focus:border-orange-500',
		primaryBg: 'bg-orange-600',
		primaryText: 'text-white',
		primaryHover: 'hover:bg-orange-700',
		paginationSpinnerBorder: 'border-t-orange-600',
		viewToggleActiveBg: 'bg-orange-600',
		viewToggleActiveText: 'text-white',
		viewToggleActiveShadow: 'shadow-sm',
		chipBg: 'bg-orange-50 dark:bg-orange-950/40',
		chipBorder: 'border-orange-200 dark:border-orange-900',
		chipText: 'text-orange-700 dark:text-orange-300',
		softHoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-950/40',
		accentText: 'text-orange-600 dark:text-orange-400',
	},
	teal: {
		focusRing: 'focus:ring-teal-500',
		focusBorder: 'focus:border-teal-500',
		primaryBg: 'bg-teal-600',
		primaryText: 'text-white',
		primaryHover: 'hover:bg-teal-700',
		paginationSpinnerBorder: 'border-t-teal-600',
		viewToggleActiveBg: 'bg-teal-600',
		viewToggleActiveText: 'text-white',
		viewToggleActiveShadow: 'shadow-sm',
		chipBg: 'bg-teal-50 dark:bg-teal-950/40',
		chipBorder: 'border-teal-200 dark:border-teal-900',
		chipText: 'text-teal-700 dark:text-teal-300',
		softHoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-950/40',
		accentText: 'text-teal-600 dark:text-teal-400',
	},
}

/** The default theme used when none is set on the config or provider. */
export const DEFAULT_COLOR_THEME: BuiltInColorTheme = 'red'

/**
 * Resolve a {@link ColorTheme} (built-in name or custom object) to its
 * {@link ThemeClasses}.
 */
export function getColorTheme(
	theme: ColorTheme = DEFAULT_COLOR_THEME
): ThemeClasses {
	if (typeof theme === 'object') return theme
	return themes[theme] ?? themes.red
}
