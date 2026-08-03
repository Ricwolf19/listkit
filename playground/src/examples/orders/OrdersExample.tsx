import {
	type DataAdapter,
	invalidateListCache,
	ListView,
} from '@pibytelabs/listkit'
import { useMemo, useState } from 'react'

import { ordersConfig } from './config'
import { ARCHIVED_ORDERS, type Order, ORDERS } from './data'

type Scope = 'active' | 'archived'

/**
 * An adapter whose rows depend on something the query never carries — exactly
 * the case `DataAdapter.key` exists for. Without the key, switching the scope
 * would show the previous dataset until a background refetch landed.
 */
const ordersAdapter = (scope: Scope): DataAdapter<Order> => ({
	key: scope,
	async fetch(query) {
		await new Promise(resolve => setTimeout(resolve, 250))
		const all = scope === 'active' ? ORDERS : ARCHIVED_ORDERS

		let rows = all
		if (query.search) {
			const term = query.search.toLowerCase()
			rows = rows.filter(
				order =>
					order.reference.toLowerCase().includes(term) ||
					order.customer.toLowerCase().includes(term)
			)
		}
		for (const filter of query.filters ?? []) {
			if (filter.type === 'select') {
				rows = rows.filter(order => order.status === filter.value)
			}
			if (filter.type === 'boolean') {
				rows = rows.filter(order => order.paid === filter.value)
			}
			if (filter.type === 'number-range') {
				const { min, max } = filter.value as { min?: number; max?: number }
				rows = rows.filter(
					order =>
						(min == null || order.total >= min) &&
						(max == null || order.total <= max)
				)
			}
		}
		if (query.sort) {
			const factor = query.sort.dir === 'desc' ? -1 : 1
			const field = query.sort.field as keyof Order
			rows = [...rows].sort((a, b) => {
				const av = a[field]
				const bv = b[field]
				if (typeof av === 'number' && typeof bv === 'number') {
					return (av - bv) * factor
				}
				return String(av).localeCompare(String(bv)) * factor
			})
		}

		const start = (query.page - 1) * query.pageSize
		return {
			data: rows.slice(start, start + query.pageSize),
			total: rows.length,
		}
	},
})

export function OrdersExample() {
	const [scope, setScope] = useState<Scope>('active')
	const adapter = useMemo(() => ordersAdapter(scope), [scope])

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center gap-3'>
				<div className='inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm'>
					{(['active', 'archived'] as const).map(value => (
						<button
							key={value}
							onClick={() => setScope(value)}
							className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
								scope === value
									? 'bg-gray-900 text-white'
									: 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							{value === 'active' ? 'Activos' : 'Archivados'}
						</button>
					))}
				</div>
				<button
					onClick={() => invalidateListCache('orders')}
					className='rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50'
				>
					Invalidar cache (ambos scopes)
				</button>
			</div>

			<ListView config={ordersConfig} adapter={adapter} />
		</div>
	)
}
