import { defineListConfig, ListImage } from 'listkit'
import { Star, Trash2 } from 'lucide-react'

import { PRODUCTS } from './data'
import { ProductCard } from './ProductCard'
import { brandTheme } from './theme'
import {
	CATEGORIES,
	currency,
	ORIGINS,
	type Product,
	ROAST_LEVELS,
	SUPPLIERS,
	TAGS,
} from './types'

export const productsConfig = defineListConfig<Product>({
	id: 'products',
	title: 'Productos',
	subtitle: 'Catálogo completo con filtros avanzados, cache y paginación',
	pageSize: 24,
	colorTheme: brandTheme,
	// 2.7+: explicit desktop default view ('cards' or 'table').
	defaultView: 'table',
	// 3.0: the sort the list opens on — reflected in the header arrow, and the
	// user can cycle or clear it from there.
	defaultSort: { field: 'name', dir: 'asc' },
	searchPlaceholder: 'Buscar por nombre, SKU o categoría…',
	emptyMessage: 'No se encontraron productos',
	// Filter down to zero results to see it.
	renderEmpty: () => (
		<div className='flex flex-col items-center gap-3 py-14 text-center'>
			<div className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
				<Star className='h-7 w-7 text-gray-400' />
			</div>
			<p className='text-lg font-semibold text-gray-900'>
				Sin resultados con estos filtros
			</p>
			<p className='max-w-xs text-sm text-gray-500'>
				Prueba quitar un filtro o busca otra cosa para ver el catálogo completo.
			</p>
			<a
				href='https://example.com/collections'
				className='mt-1 inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700'
			>
				Ver colección
			</a>
		</div>
	),
	search: { fields: ['name', 'sku', 'category'] },
	sort: data => [...data].sort((a, b) => a.name.localeCompare(b.name)),
	getItemKey: item => item.id,

	filtersTitle: 'Filtrar productos',
	filters: [
		{
			id: 'attributes',
			title: 'Atributos',
			filters: [
				{
					id: 'category',
					field: 'category',
					label: 'Categoría',
					type: 'select',
					options: CATEGORIES.map(c => ({ value: c, label: c })),
				},
				{
					id: 'tags',
					field: 'tags',
					label: 'Etiquetas',
					type: 'multi-select',
					options: TAGS.map(t => ({ value: t, label: t })),
				},
				{
					id: 'name',
					field: 'name',
					label: 'Nombre',
					type: 'text',
					placeholder: 'Buscar por nombre…',
				},
				{
					id: 'sku',
					field: 'sku',
					label: 'SKU',
					type: 'text',
					placeholder: 'SKU-10000…',
				},
			],
		},
		{
			id: 'origin',
			title: 'Origen y proveedor',
			// 2.8: collapsible section — starts open, hides behind "Show options".
			collapsible: true,
			filters: [
				{
					id: 'supplier',
					field: 'supplier',
					label: 'Proveedor',
					type: 'select',
					searchable: true,
					options: SUPPLIERS.map(s => ({ value: s, label: s })),
				},
				{
					id: 'country',
					field: 'origin',
					label: 'País de origen',
					type: 'select',
					searchable: true,
					options: ORIGINS.map(o => ({ value: o, label: o })),
				},
				{
					id: 'roast',
					field: 'roastLevel',
					label: 'Nivel de tueste',
					type: 'select',
					options: ROAST_LEVELS.map(r => ({ value: r, label: r })),
				},
			],
		},
		{
			id: 'ranges',
			title: 'Rangos',
			filters: [
				{
					id: 'price',
					field: 'price',
					label: 'Precio (MXN)',
					type: 'number-range',
					// 2.8: dual-thumb slider instead of two inputs.
					display: 'slider',
					min: 0,
					max: 1000,
					step: 10,
					formatValue: currency,
					columns: 1,
				},
				{
					id: 'rating',
					field: 'rating',
					label: 'Calificación (0–5)',
					type: 'number-range',
					display: 'slider',
					min: 0,
					max: 5,
					step: 0.5,
					formatValue: n => `${n}★`,
					columns: 1,
				},
				{
					id: 'stock',
					field: 'stock',
					label: 'Existencias (con inputs)',
					type: 'number-range',
					columns: 2,
				},
				{
					id: 'weight',
					field: 'weightGrams',
					label: 'Peso (g)',
					type: 'number-range',
					columns: 2,
				},
				{
					// The grouping demo. Type `1,500,000` with the separators and it
					// parses; the applied chip reads through `formatValue`, the inputs
					// through the locale's plain grouping so the text round-trips.
					id: 'revenue',
					field: 'revenueMXN',
					label: 'Ventas acumuladas',
					type: 'number-range',
					formatValue: currency,
					columns: 1,
				},
				{
					id: 'createdAt',
					field: 'createdAt',
					label: 'Fecha de alta',
					type: 'date-range',
					columns: 2,
				},
				{
					id: 'inStock',
					field: 'inStock',
					label: 'Disponibilidad',
					type: 'boolean',
					trueLabel: 'En stock',
					falseLabel: 'Agotado',
					// 2.6: pre-applied on a pristine list (shows a default chip).
					defaultValue: true,
					// 3.0: also surfaced as a one-click chip in the toolbar.
					pinned: true,
					columns: 2,
				},
			],
		},
		{
			id: 'flags',
			title: 'Otros',
			// 2.8: collapsible section that starts collapsed.
			collapsible: true,
			defaultCollapsed: true,
			filters: [
				{
					id: 'featured',
					field: 'featured',
					label: 'Destacado',
					type: 'boolean',
					trueLabel: 'Solo destacados',
					falseLabel: 'No destacados',
					// 3.0: pinned without a defaultValue — the chip applies `true`.
					pinned: true,
				},
			],
		},
	],

	actions: {
		onEdit: item => alert(`Editar ${item.name}`),
		onDelete: item => alert(`Eliminar ${item.name}`),
	},

	// 2.11: CSV export. Current page is auto for in-memory; "export all" is wired
	// here via fetchAll so it also works against the async adapter (a real app
	// would point this at a bulk endpoint applying the current query server-side).
	export: {
		fileName: 'productos',
		fetchAll: async () => PRODUCTS,
	},

	// 2.11: key-based row selection + bulk actions (survives pagination, clears
	// on dataset change). Pairs with "export selected" since export is enabled.
	selection: {
		actions: [
			{
				label: 'Destacar',
				icon: <Star size={16} />,
				// Bulk actions receive the selected rows + helpers (keys + clear).
				onClick: rows => alert(`Destacar ${rows.length} producto(s)`),
			},
			{
				label: 'Eliminar',
				icon: <Trash2 size={16} />,
				variant: 'danger',
				onClick: (rows, { clear }) => {
					alert(`Eliminar ${rows.length} producto(s)`)
					clear() // drop the selection after the bulk action
				},
			},
		],
		onSelectionChange: rows => console.log('Seleccionados:', rows.length),
	},

	table: {
		// 3.0: the column manager, header reordering, edge resizing and the density
		// toggle are all on by default for any table — no flags needed. Switch one
		// off with `columnControl: false` (etc.) if a list should not offer it.
		// Header sticks to the top of the viewport as the page scrolls.
		stickyHeader: false,
		columns: [
			{
				key: 'image',
				header: '',
				width: '64px',
				exportable: false,
				render: item => (
					<ListImage src={item.image} alt={item.name} width={40} height={40} />
				),
			},
			{ key: 'name', header: 'Nombre', sortable: true, truncate: true },
			{ key: 'sku', header: 'SKU' },
			{ key: 'category', header: 'Categoría', sortable: true },
			// `truncate` follows the column's live width — resize (or double-click
			// the edge to auto-fit) and the ellipsis moves with it. `defaultHidden`
			// starts a column off but leaves it in the manager, so switch these on
			// from Opciones → Columnas.
			{
				key: 'supplier',
				header: 'Proveedor',
				truncate: true,
				width: '12rem',
				defaultHidden: true,
			},
			{ key: 'stock', header: 'Stock', align: 'right', sortable: true },
			{
				key: 'price',
				header: 'Precio',
				align: 'right',
				sortable: true,
				render: item => currency(item.price),
				// render returns a string here, but show the explicit export value.
				exportValue: item => item.price,
			},
			{
				key: 'revenueMXN',
				header: 'Ventas',
				align: 'right',
				sortable: true,
				render: item => currency(item.revenueMXN),
				exportValue: item => item.revenueMXN,
			},
			// More default-hidden columns to exercise the toggle: open the options
			// menu → "Columnas" and switch these on.
			{
				key: 'origin',
				header: 'Origen',
				sortable: true,
				defaultHidden: true,
			},
			{
				key: 'roastLevel',
				header: 'Tueste',
				defaultHidden: true,
			},
			{
				key: 'rating',
				header: 'Calificación',
				align: 'right',
				sortable: true,
				defaultHidden: true,
				render: item => `${item.rating}★`,
			},
			{
				key: 'weightGrams',
				header: 'Peso (g)',
				align: 'right',
				sortable: true,
				defaultHidden: true,
			},
			{
				key: 'createdAt',
				header: 'Alta',
				sortable: true,
				defaultHidden: true,
			},
		],
	},

	card: ProductCard,
})
