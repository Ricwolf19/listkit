import { defineListConfig, ListImage } from '@pibytelabs/listkit'
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
	searchPlaceholder: 'Buscar por nombre, SKU o categoría…',
	emptyMessage: 'No se encontraron productos',
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
		// 2.8: column manager (hide/show + reorder, persisted to localStorage).
		columnControl: true,
		// 2.11: drag headers to reorder, drag edges to resize, density toggle —
		// all persisted to localStorage and folded into one toolbar options menu.
		reorderable: true,
		resizable: true,
		density: true,
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
			// truncate clips to the column's visible width and is fully dynamic:
			// resize the column (or double-click the edge to auto-fit) and the
			// ellipsis follows. `width` is just the initial size; min/max are
			// optional caps (omitted here so resize is unbounded).
			{ key: 'supplier', header: 'Proveedor', truncate: true, width: '12rem' },
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
		],
	},

	card: ProductCard,
})
