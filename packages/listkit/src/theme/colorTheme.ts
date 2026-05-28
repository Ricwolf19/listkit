export type ColorTheme =
	| 'blue'
	| 'red'
	| 'green'
	| 'yellow'
	| 'purple'
	| 'pink'
	| 'orange'
	| 'teal'

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
}

const themes: Record<ColorTheme, ThemeClasses> = {
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
	},
}

export const DEFAULT_COLOR_THEME: ColorTheme = 'red'

export function getColorTheme(
	theme: ColorTheme = DEFAULT_COLOR_THEME
): ThemeClasses {
	return themes[theme] ?? themes.red
}
