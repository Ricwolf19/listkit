import { type ShortcutId, SHORTCUTS } from '../hooks/shortcutRegistry'
import { cn } from '../utils/cn'

type ShortcutKeysProps = {
	/** Which registry entry to render. Unknown ids render nothing. */
	id: ShortcutId
	className?: string
}

/**
 * A shortcut's chord as `<kbd>` tokens, read from the registry rather than
 * written out.
 *
 * Shared by the help overlay and the options menu so a control and its key can
 * never disagree: rebinding a shortcut is still one edit in
 * {@link SHORTCUTS}, and every place that displays it follows.
 */
export function ShortcutKeys({ id, className }: ShortcutKeysProps) {
	const shortcut = SHORTCUTS.find(entry => entry.id === id)
	if (!shortcut) return null

	return (
		<span className={cn('flex shrink-0 items-center gap-1', className)}>
			{shortcut.keys().map((key, index) => (
				<kbd
					key={index}
					className={cn(
						'rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 dark:border-gray-700 dark:bg-gray-800',
						'font-sans text-xs font-medium text-gray-600 dark:text-gray-400'
					)}
				>
					{key}
				</kbd>
			))}
		</span>
	)
}
