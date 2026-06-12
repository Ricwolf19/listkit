import { ImageOff } from 'lucide-react'
import { type ElementType, useState } from 'react'

import { cn } from '../utils/cn'

/** Props for {@link ListImage}. */
export type ListImageProps = {
	/** Image URL. */
	src: string
	/** Accessible alt text. */
	alt: string
	/** Box width — a number is treated as pixels. @defaultValue 40 */
	width?: number | string
	/** Box height — a number is treated as pixels. @defaultValue 40 */
	height?: number | string
	/** Extra classes on the wrapper (e.g. ring, shadow). */
	className?: string
	/** Rounded corners: `true` → `rounded-lg`, or pass a Tailwind radius class. @defaultValue true */
	rounded?: boolean | string
	/** Shown when the image fails to load. Falls back to a broken-image glyph. */
	fallbackSrc?: string
	/**
	 * Render a framework image component (e.g. `next/image`) instead of a plain
	 * `<img>`. It receives `src`, `alt`, numeric `width`/`height`, `loading`,
	 * `className`, and the load/error handlers.
	 */
	as?: ElementType
	/** Native loading strategy. @defaultValue 'lazy' */
	loading?: 'lazy' | 'eager'
	/** Extra props forwarded to the underlying image element. */
	imgProps?: Record<string, unknown>
}

const toCssSize = (v: number | string): string =>
	typeof v === 'number' ? `${v}px` : v

/**
 * Drop-in image for dense tables and cards: reserves its box (no layout shift),
 * lazy-loads and async-decodes by default, shows a shimmer placeholder while
 * loading and a fallback on error. Pass `as={NextImage}` to get framework
 * optimization in Next.js; plain React falls back to `<img>`.
 *
 * @example
 * ```tsx
 * // In a column renderer or card:
 * render: u => <ListImage src={u.avatarUrl} alt={u.name} width={36} height={36} rounded />
 * // With Next.js optimization:
 * <ListImage as={Image} src={src} alt={alt} width={48} height={48} />
 * ```
 */
export function ListImage({
	src,
	alt,
	width = 40,
	height = 40,
	className,
	rounded = true,
	fallbackSrc,
	as,
	loading = 'lazy',
	imgProps,
}: ListImageProps) {
	const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
		'loading'
	)
	const Img = (as ?? 'img') as ElementType
	const radius = rounded === true ? 'rounded-lg' : rounded || ''
	const brokenNoFallback = status === 'error' && !fallbackSrc
	const finalSrc = status === 'error' && fallbackSrc ? fallbackSrc : src

	return (
		<span
			className={cn(
				'relative inline-block shrink-0 overflow-hidden bg-gray-100 align-middle',
				radius,
				className
			)}
			style={{ width: toCssSize(width), height: toCssSize(height) }}
		>
			{status === 'loading' && (
				<span
					className='absolute inset-0 animate-pulse bg-gray-200'
					aria-hidden='true'
				/>
			)}
			{brokenNoFallback ? (
				<span
					className='absolute inset-0 flex items-center justify-center text-gray-300'
					role='img'
					aria-label={alt}
				>
					<ImageOff className='h-1/2 w-1/2' />
				</span>
			) : (
				<Img
					src={finalSrc}
					alt={alt}
					width={typeof width === 'number' ? width : undefined}
					height={typeof height === 'number' ? height : undefined}
					loading={loading}
					decoding='async'
					onLoad={() => setStatus('loaded')}
					onError={() => setStatus(s => (s === 'error' ? s : 'error'))}
					className={cn(
						'h-full w-full object-cover transition-opacity duration-200',
						status === 'loaded' ? 'opacity-100' : 'opacity-0'
					)}
					{...imgProps}
				/>
			)}
		</span>
	)
}
