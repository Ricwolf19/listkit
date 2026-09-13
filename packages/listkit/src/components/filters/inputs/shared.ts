import { getColorTheme } from '../../../theme/colorTheme'
import { cn } from '../../../utils/cn'

/** Shared input chrome for filter fields. Uses a subtle 1px focus ring. */
export const fieldClass = (theme: ReturnType<typeof getColorTheme>) =>
	cn(
		'block h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-150 focus:ring-1 focus:outline-none',
		theme.focusRing,
		theme.focusBorder
	)
