import { defineListConfig } from '@pibytelabs/listkit'

import { ProductCard } from './ProductCard'
import { brandTheme } from './theme'
import { CATEGORIES, currency, type Product, TAGS } from './types'

export const productsConfig = defineListConfig<Product>({
	id: 'products',
	title: 'Productos',
	subtitle: 'Catálogo completo con filtros avanzados, cache y paginación',
	pageSize: 12,
	colorTheme: brandTheme,
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
					columns: 2,
				},
				{
					id: 'stock',
					field: 'stock',
					label: 'Existencias',
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
					columns: 2,
				},
			],
		},
	],

	actions: {
		onEdit: item => alert(`Editar ${item.name}`),
		onDelete: item => alert(`Eliminar ${item.name}`),
	},

	table: {
		columns: [
			{ key: 'name', header: 'Nombre' },
			{ key: 'sku', header: 'SKU' },
			{ key: 'category', header: 'Categoría' },
			{ key: 'stock', header: 'Stock', align: 'right' },
			{
				key: 'price',
				header: 'Precio',
				align: 'right',
				render: item => currency(item.price),
			},
		],
	},

	card: ProductCard,
})
