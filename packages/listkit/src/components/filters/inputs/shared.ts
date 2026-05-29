import { getColorTheme } from '../../../theme/colorTheme'
import { cn } from '../../../utils/cn'

/** Shared input chrome for filter fields. Uses a subtle 1px focus ring. */
export const fieldClass = (theme: ReturnType<typeof getColorTheme>) =>
	cn(
		'block h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-150 focus:ring-1 focus:outline-none',
		theme.focusRing,
		theme.focusBorder
	)
