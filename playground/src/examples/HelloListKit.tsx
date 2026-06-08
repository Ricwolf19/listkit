import {
	ListView,
	// memoryAdapter,
	serverActionAdapter,
	useListRefresh,
} from '@pibytelabs/listkit'
import { Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { productsConfig } from './products/config'
import { PRODUCTS } from './products/data'

// const memory = memoryAdapter(PRODUCTS, {
// 	search: { fields: ['name', 'sku', 'category'] },
// 	sort: data => [...data].sort((a, b) => a.name.localeCompare(b.name)),
// })

const asyncAdapter = serverActionAdapter<(typeof PRODUCTS)[0]>(async query => {
	// Simulate network latency so skeletons and cache are visible
	await new Promise(r => setTimeout(r, 300))

	const all = [...PRODUCTS]
	const { search, filters, page, pageSize, sort } = query

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

	// Client-side filter simulation — generic by f.field so every advanced
	// filter targets the right Product property (not a hardcoded one).
	if (filters) {
		for (const f of filters) {
			const get = (r: (typeof PRODUCTS)[0]) =>
				r[f.field as keyof (typeof PRODUCTS)[0]]

			if (f.type === 'select' && f.value) {
				rows = rows.filter(r => get(r) === f.value)
			}
			if (f.type === 'multi-select' && Array.isArray(f.value)) {
				rows = rows.filter(r => {
					const v = get(r)
					return Array.isArray(v)
						? (f.value as string[]).some(x => (v as string[]).includes(x))
						: (f.value as string[]).includes(String(v))
				})
			}
			if (f.type === 'text' && f.value && typeof f.value === 'object') {
				const { value, match } = f.value as {
					value: string
					match?: 'exact' | 'partial'
				}
				const term = value.toLowerCase()
				rows = rows.filter(r => {
					const field = String(get(r)).toLowerCase()
					return match === 'exact' ? field === term : field.includes(term)
				})
			}
			if (f.type === 'boolean' && typeof f.value === 'boolean') {
				rows = rows.filter(r => get(r) === f.value)
			}
			if (f.type === 'number-range' && typeof f.value === 'object') {
				const { min, max } = f.value as { min?: number; max?: number }
				rows = rows.filter(r => {
					const n = get(r) as number
					if (min != null && n < min) return false
					if (max != null && n > max) return false
					return true
				})
			}
			if (f.type === 'date-range' && typeof f.value === 'object') {
				const { from, to } = f.value as { from?: string; to?: string }
				rows = rows.filter(r => {
					const d = String(get(r))
					if (from && d < from) return false
					if (to && d > to) return false
					return true
				})
			}
		}
	}

	// Column sort (server-side simulation)
	if (sort) {
		const factor = sort.dir === 'desc' ? -1 : 1
		rows = [...rows].sort((a, b) => {
			const av = a[sort.field as keyof typeof a]
			const bv = b[sort.field as keyof typeof b]
			if (typeof av === 'number' && typeof bv === 'number') {
				return (av - bv) * factor
			}
			return String(av).localeCompare(String(bv)) * factor
		})
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
				paginationVariant='sticky'
				headerContent={{
					left: <Metric label='Catálogo' value={PRODUCTS.length} />,
					right: (
						<span className='rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700'>
							v2.8 showcase
						</span>
					),
				}}
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

function Metric({ label, value }: { label: string; value: number }) {
	return (
		<span className='inline-flex items-baseline gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm shadow-sm ring-1 ring-gray-100'>
			<span className='font-bold text-gray-900'>{value}</span>
			<span className='text-gray-500'>{label}</span>
		</span>
	)
}
