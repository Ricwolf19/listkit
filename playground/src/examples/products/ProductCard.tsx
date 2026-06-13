import { type CardContext, Checkbox, ListImage } from '@pibytelabs/listkit'
import { Pencil, Trash2 } from 'lucide-react'

import { currency, type Product } from './types'

/**
 * Card renderer for a Product. Receives the item plus the CardContext, which
 * carries the `actions`, the active theme, and (when enabled) `selection`
 * helpers — no prop drilling needed.
 */
export function ProductCard(item: Product, ctx: CardContext<Product>) {
	const selected = ctx.selection?.isSelected(item) ?? false
	return (
		<>
			<div className='mb-3 flex items-center justify-between gap-2'>
				<div className='flex min-w-0 items-center gap-3'>
					{ctx.selection && (
						<Checkbox
							checked={selected}
							onChange={() => ctx.selection!.toggle(item)}
							colorTheme={ctx.colorTheme}
							aria-label={`Seleccionar ${item.name}`}
						/>
					)}
					<ListImage src={item.image} alt={item.name} width={44} height={44} />
					<div className='min-w-0'>
						<h3 className='truncate font-semibold text-gray-900'>
							{item.name}
						</h3>
						<p className='text-xs text-gray-500'>{item.sku}</p>
					</div>
				</div>
				<div className='flex gap-1'>
					<button
						onClick={() => ctx.actions.onEdit?.(item)}
						className='cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700'
						aria-label='Editar'
					>
						<Pencil size={14} />
					</button>
					<button
						onClick={() => ctx.actions.onDelete?.(item)}
						className='cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600'
						aria-label='Eliminar'
					>
						<Trash2 size={14} />
					</button>
				</div>
			</div>
			<div className='mt-auto flex items-center justify-between pt-2 text-sm text-gray-600'>
				<span className='rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600'>
					{item.category}
				</span>
				<span className='font-semibold text-gray-900'>
					{currency(item.price)}
				</span>
			</div>
			<p className='mt-1 text-xs text-gray-400'>Stock: {item.stock}</p>
		</>
	)
}
