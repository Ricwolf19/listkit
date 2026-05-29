import type { ThemeClasses } from '@pibytelabs/listkit'

/**
 * A custom brand theme — not one of the 8 built-ins. Pass a full `ThemeClasses`
 * object to `colorTheme` (or to `<ListKitProvider theme={…}>`) to use arbitrary
 * brand colors. Arbitrary Tailwind values (`bg-[#…]`) work because the consumer's
 * source is scanned by Tailwind.
 */
export const brandTheme: ThemeClasses = {
	focusRing: 'focus:ring-[#4f46e5]',
	focusBorder: 'focus:border-[#4f46e5]',
	primaryBg: 'bg-[#4f46e5]',
	primaryText: 'text-white',
	primaryHover: 'hover:bg-[#4338ca]',
	paginationSpinnerBorder: 'border-t-[#4f46e5]',
	viewToggleActiveBg: 'bg-[#4f46e5]',
	viewToggleActiveText: 'text-white',
	viewToggleActiveShadow: 'shadow-sm',
	chipBg: 'bg-[#eef2ff]',
	chipBorder: 'border-[#c7d2fe]',
	chipText: 'text-[#4338ca]',
	softHoverBg: 'hover:bg-[#eef2ff]',
	accentText: 'text-[#4f46e5]',
}
