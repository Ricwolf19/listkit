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
		chipBg: 'bg-blue-50',
		chipBorder: 'border-blue-200',
		chipText: 'text-blue-700',
		softHoverBg: 'hover:bg-blue-50',
		accentText: 'text-blue-600',
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
		chipBg: 'bg-red-50',
		chipBorder: 'border-red-200',
		chipText: 'text-red-700',
		softHoverBg: 'hover:bg-red-50',
		accentText: 'text-red-600',
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
		chipBg: 'bg-green-50',
		chipBorder: 'border-green-200',
		chipText: 'text-green-700',
		softHoverBg: 'hover:bg-green-50',
		accentText: 'text-green-600',
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
		chipBg: 'bg-yellow-50',
		chipBorder: 'border-yellow-200',
		chipText: 'text-yellow-800',
		softHoverBg: 'hover:bg-yellow-50',
		accentText: 'text-yellow-700',
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
		chipBg: 'bg-purple-50',
		chipBorder: 'border-purple-200',
		chipText: 'text-purple-700',
		softHoverBg: 'hover:bg-purple-50',
		accentText: 'text-purple-600',
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
		chipBg: 'bg-pink-50',
		chipBorder: 'border-pink-200',
		chipText: 'text-pink-700',
		softHoverBg: 'hover:bg-pink-50',
		accentText: 'text-pink-600',
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
		chipBg: 'bg-orange-50',
		chipBorder: 'border-orange-200',
		chipText: 'text-orange-700',
		softHoverBg: 'hover:bg-orange-50',
		accentText: 'text-orange-600',
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
		chipBg: 'bg-teal-50',
		chipBorder: 'border-teal-200',
		chipText: 'text-teal-700',
		softHoverBg: 'hover:bg-teal-50',
		accentText: 'text-teal-600',
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
