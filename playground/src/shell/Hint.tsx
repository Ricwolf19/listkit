import type { ReactNode } from 'react'

/** A short note beside a control strip. */
export const Hint = ({ children }: { children: ReactNode }) => (
	<p className='text-xs text-gray-500'>{children}</p>
)
