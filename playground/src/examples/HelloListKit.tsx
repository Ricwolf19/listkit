import {
	ListView,
	// memoryAdapter,
	serverActionAdapter,
	useListRefresh,
} from 'listkit'
import { Plus, RefreshCw, Upload } from 'lucide-react'
import { useState } from 'react'

import { ExampleShell, type Legend } from '../shell/ExampleShell'
import { Segmented } from '../shell/Segmented'
import { productsConfig } from './products/config'
import { PRODUCTS } from './products/data'

const LEGENDS: Legend[] = [
	{
		action: 'Cambia de página en modo Async',
		expect:
			'la primera vez muestra skeletons; al volver es instantáneo — la respuesta quedó en cache (staleTime 10 s).',
	},
	{
		action: 'Pulsa «Refrescar lista»',
		expect:
			'useListRefresh() invalida y refetchea desde un componente hermano, sin recargar la página.',
	},
	{
		action: 'Cambia a In-memory',
		expect:
			'la misma config sin adapter: pasar un arreglo plano sigue siendo válido.',
	},
	{
		action: 'Mira las tarjetas',
		expect:
			'card propia (ProductCard) en vez de la autogenerada de las columnas.',
	},
	{
		action: 'Achica la ventana bajo 1024px',
		expect: 'la vista cambia sola a tarjetas.',
	},
	{
		action: 'Fíjate en los extremos del encabezado',
		expect: 'headerContent monta slots propios a izquierda y derecha.',
	},
	{
		action: 'Angosta la ventana hasta que el toolbar no quepa',
		expect:
			'las acciones se pliegan en el ••• del toolbar, agrupadas bajo «Datos».',
	},
	{
		action: 'Abre Opciones → Columnas',
		expect: 'revela las ocultas por defecto (Proveedor, Origen…).',
	},
	{
		action: 'Fíjate en las miniaturas al scrollear',
		expect: 'ListImage carga en diferido con shimmer y fallback de error.',
	},
	{
		action: 'Filtra hasta vaciar la lista',
		expect: 'renderEmpty pone un vacío propio en lugar del genérico.',
	},
]

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
		<ExampleShell
			title='Async y cache'
			subtitle='El mismo catálogo servido por un adapter con 300 ms de latencia o desde memoria, para comparar skeletons, cache y refresco.'
			legends={LEGENDS}
			controls={
				<>
					<Segmented
						value={mode}
						onChange={setMode}
						options={[
							{ value: 'async', label: 'Async (con cache)' },
							{ value: 'memory', label: 'In-memory' },
						]}
					/>
					{mode === 'async' && <RefreshBadge />}
				</>
			}
		>
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
							header slot
						</span>
					),
				}}
				toolbarActions={[
					{
						label: 'Nuevo',
						icon: <Plus size={16} />,
						onClick: () => alert('Nuevo producto'),
					},
					{
						label: 'Importar CSV',
						icon: <Upload size={16} />,
						variant: 'outline',
						group: 'Datos',
						onClick: () => alert('Importar'),
					},
					{
						label: 'Sincronizar catálogo',
						icon: <RefreshCw size={16} />,
						variant: 'outline',
						group: 'Datos',
						onClick: () => alert('Sincronizar'),
					},
				]}
			/>
		</ExampleShell>
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
