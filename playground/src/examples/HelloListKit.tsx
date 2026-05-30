import {
	ListView,
	memoryAdapter,
	serverActionAdapter,
	useListRefresh,
} from '@pibytelabs/listkit'
import { Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { productsConfig } from './products/config'
import { PRODUCTS } from './products/data'

const memory = memoryAdapter(PRODUCTS, {
	search: { fields: ['name', 'sku', 'category'] },
	sort: data => [...data].sort((a, b) => a.name.localeCompare(b.name)),
})

const asyncAdapter = serverActionAdapter<(typeof PRODUCTS)[0]>(async query => {
	// Simulate network latency so skeletons and cache are visible
	await new Promise(r => setTimeout(r, 300))

	const all = [...PRODUCTS]
	const { search, filters, page, pageSize } = query

	let rows = all

	// Client-side search simulation
	if (search) {
		const term = search.toLowerCase()
		rows = rows.filter(
			r =>
				r.name.toLowerCase().includes(term) ||
				r.sku.toLowerCase().includes(term) ||
				r.category.toLowerCase().includes(term)
		)
	}

	// Client-side filter simulation
	if (filters) {
		for (const f of filters) {
			if (f.type === 'select' && f.value) {
				rows = rows.filter(r => r.category === f.value)
			}
			if (f.type === 'multi-select' && Array.isArray(f.value)) {
				rows = rows.filter(r =>
					(f.value as string[]).some(v => r.tags.includes(v))
				)
			}
			if (f.type === 'text' && f.value && typeof f.value === 'object') {
				const term = (f.value as { value: string }).value.toLowerCase()
				rows = rows.filter(r => r.name.toLowerCase().includes(term))
			}
			if (f.type === 'boolean' && typeof f.value === 'boolean') {
				rows = rows.filter(r => r.inStock === f.value)
			}
			if (f.type === 'number-range' && typeof f.value === 'object') {
				const { min, max } = f.value as { min?: number; max?: number }
				rows = rows.filter(r => {
					if (min != null && r.price < min) return false
					if (max != null && r.price > max) return false
					return true
				})
			}
			if (f.type === 'date-range' && typeof f.value === 'object') {
				const { from, to } = f.value as { from?: string; to?: string }
				rows = rows.filter(r => {
					if (from && r.createdAt < from) return false
					if (to && r.createdAt > to) return false
					return true
				})
			}
		}
	}

	const total = rows.length
	const start = (page - 1) * pageSize
	const paginated = rows.slice(start, start + pageSize)

	return { data: paginated, total }
})

/**
 * Demo list with two modes:
 * 1. Async adapter (simulated 300ms latency) to show skeletons, cache, and
 *    useListRefresh.
 * 2. Toggle to in-memory mode for instant client-side filtering.
 */
export function HelloListKit() {
	const [mode, setMode] = useState<'async' | 'memory'>('async')

	return (
		<div className='space-y-4'>
			<div className='flex items-center gap-3'>
				<div className='inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 shadow-sm'>
					<button
						onClick={() => setMode('async')}
						className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
							mode === 'async'
								? 'bg-gray-900 text-white'
								: 'text-gray-600 hover:bg-gray-100'
						}`}
					>
						Async (con cache)
					</button>
					<button
						onClick={() => setMode('memory')}
						className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
							mode === 'memory'
								? 'bg-gray-900 text-white'
								: 'text-gray-600 hover:bg-gray-100'
						}`}
					>
						In-memory
					</button>
				</div>
				{mode === 'async' && <RefreshBadge />}
			</div>

			<ListView
				config={productsConfig}
				adapter={mode === 'async' ? asyncAdapter : undefined}
				data={mode === 'memory' ? PRODUCTS : undefined}
				staleTime={mode === 'async' ? 10_000 : 0}
				toolbarActions={[
					{
						label: 'Nuevo',
						icon: <Plus size={16} />,
						onClick: () => alert('Nuevo producto'),
					},
				]}
			/>
		</div>
	)
}

function RefreshBadge() {
	const refresh = useListRefresh()
	return (
		<button
			onClick={() => refresh()}
			className='inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50'
		>
			<RefreshCw size={14} />
			Refrescar lista
		</button>
	)
}
