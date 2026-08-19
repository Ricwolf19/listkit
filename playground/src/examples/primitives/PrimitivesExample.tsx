import {
	Cards,
	type ColumnDef,
	type FadeTone,
	Pagination,
	ScrollArea,
	SearchInput,
	Table,
	ViewToggle,
	type ViewType,
} from 'listkit'
import { useMemo, useState } from 'react'

import { ExampleShell, type Legend } from '../../shell/ExampleShell'
import { Hint } from '../../shell/Hint'
import { formatMoney, type Invoice, INVOICES } from '../invoices/data'

const LEGENDS: Legend[] = [
	{
		action: 'Lee el código de este demo',
		expect:
			'no hay defineListConfig, ni adapter, ni ListView — sólo primitivas sobre useState propio.',
	},
	{
		action: 'Escribe en el buscador',
		expect:
			'SearchInput es totalmente controlado: el filtrado y el reset de página son de este componente, no de listkit.',
	},
	{
		action: 'Ordena por Total o Folio',
		expect:
			'Table sólo reporta el click con onSort; quién ordena los datos eres tú.',
	},
	{
		action: 'Cambia entre tabla y tarjetas',
		expect:
			'ViewToggle es un control controlado más; aquí no hay persistencia ni sincronía con la URL.',
	},
	{
		action: 'Vacía la búsqueda hasta no encontrar nada',
		expect: 'Table y Cards muestran su estado vacío por su cuenta.',
	},
	{
		action: 'Fíjate en los textos de la paginación',
		expect:
			'las primitivas leen los labels del provider si existe, y caen a DEFAULT_LABELS si no.',
	},
	{
		action: 'Scrollea las tres tiras de abajo',
		expect:
			'ScrollArea con fadeTone: surface (el default en todos lados) disuelve contra el panel; shadow y shadow-strong son variantes opt-in que oscurecen el borde.',
	},
]

const PAGE_SIZE = 8

const COLUMNS: ColumnDef<Invoice>[] = [
	{ key: 'number', header: 'Folio', sortable: true },
	{ key: 'customer.name', header: 'Cliente', grow: true },
	{ key: 'status', header: 'Estado' },
	{
		key: 'total',
		header: 'Total',
		align: 'right',
		sortable: true,
		render: i => formatMoney(i.total, i.currency),
	},
]

/**
 * The composability contract, exercised: every primitive is driven entirely by
 * props and reads only optional context, so a `<Table>` over your own data —
 * no config, no adapter, no provider — is a supported use.
 */
export function PrimitivesExample() {
	const [term, setTerm] = useState('')
	const [page, setPage] = useState(1)
	const [view, setView] = useState<ViewType>('table')
	const [sortField, setSortField] = useState<string | null>('number')
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

	const rows = useMemo(() => {
		const needle = term.trim().toLowerCase()
		const matched = needle
			? INVOICES.filter(
					i =>
						i.number.toLowerCase().includes(needle) ||
						i.customer.name.toLowerCase().includes(needle)
				)
			: INVOICES
		if (!sortField) return matched
		const factor = sortDir === 'desc' ? -1 : 1
		return [...matched].sort((a, b) => {
			if (sortField === 'total') return (a.total - b.total) * factor
			const av = sortField === 'number' ? a.number : a.customer.name
			const bv = sortField === 'number' ? b.number : b.customer.name
			return av.localeCompare(bv) * factor
		})
	}, [term, sortField, sortDir])

	const start = (page - 1) * PAGE_SIZE
	const pageRows = rows.slice(start, start + PAGE_SIZE)

	const onSort = (field: string) => {
		if (field === sortField) {
			setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'))
		} else {
			setSortField(field)
			setSortDir('asc')
		}
		setPage(1)
	}

	return (
		<ExampleShell
			title='Primitivas sueltas'
			subtitle='Table, Cards, Pagination, SearchInput y ViewToggle sobre estado propio — sin config, sin adapter, sin ListView.'
			legends={LEGENDS}
			controls={
				<Hint>
					Todo el estado de este demo vive en cinco useState de este archivo.
				</Hint>
			}
		>
			<div className='flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div className='w-full max-w-xs'>
						<SearchInput
							value={term}
							onChange={value => {
								setTerm(value)
								setPage(1)
							}}
							placeholder='Buscar folio o cliente…'
						/>
					</div>
					<ViewToggle view={view} onViewChange={setView} />
				</div>

				{view === 'table' ? (
					<Table
						data={pageRows}
						columns={COLUMNS}
						keyExtractor={i => i.id}
						sort={sortField ? { field: sortField, dir: sortDir } : undefined}
						onSort={onSort}
						emptyMessage='Ninguna factura coincide'
					/>
				) : (
					<Cards
						data={pageRows}
						keyExtractor={i => i.id}
						emptyMessage='Ninguna factura coincide'
						renderCard={i => (
							<div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
								<div className='flex items-baseline justify-between gap-2'>
									<span className='font-semibold text-gray-900 dark:text-gray-100'>
										{i.number}
									</span>
									<span className='text-sm text-gray-500 dark:text-gray-400'>
										{i.status}
									</span>
								</div>
								<p className='mt-1 truncate text-sm text-gray-600 dark:text-gray-400'>
									{i.customer.name}
								</p>
								<p className='mt-2 text-lg font-bold text-gray-900 tabular-nums dark:text-gray-100'>
									{formatMoney(i.total, i.currency)}
								</p>
							</div>
						)}
					/>
				)}

				<Pagination
					variant='inline'
					currentPage={page}
					totalPages={Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}
					totalItems={rows.length}
					itemsPerPage={PAGE_SIZE}
					onPageChange={setPage}
				/>
			</div>

			<div className='mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
				<div>
					<h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
						ScrollArea · fadeTone
					</h3>
					<p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
						La misma tira con los tres tonos de fade: surface (default) disuelve
						contra el panel, shadow y shadow-strong oscurecen el borde.
					</p>
				</div>
				<div className='grid gap-3 md:grid-cols-3'>
					{(['surface', 'shadow', 'shadow-strong'] as const).map(tone => (
						<FadeToneStrip key={tone} tone={tone} />
					))}
				</div>
			</div>
		</ExampleShell>
	)
}

function FadeToneStrip({ tone }: { tone: FadeTone }) {
	return (
		<div className='min-w-0'>
			<span className='font-mono text-xs font-medium text-gray-600 dark:text-gray-400'>
				{tone}
			</span>
			<ScrollArea
				axis='x'
				fadeTone={tone}
				wrapperClassName='mt-1 rounded-lg border border-gray-200 dark:border-gray-800'
				className='rounded-lg'
			>
				<div className='flex gap-2 p-3'>
					{INVOICES.slice(0, 14).map(i => (
						<span
							key={i.id}
							className='shrink-0 rounded-md bg-gray-100 px-2.5 py-1 text-xs whitespace-nowrap text-gray-700 dark:bg-gray-800 dark:text-gray-300'
						>
							{i.number}
						</span>
					))}
				</div>
			</ScrollArea>
		</div>
	)
}
