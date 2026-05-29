import { defineListConfig } from '@pibytelabs/listkit'

import { ProductCard } from './ProductCard'
import { brandTheme } from './theme'
import { CATEGORIES, currency, type Product, TAGS } from './types'

/**
 * One config describes the whole list view. Keeping it in its own file (next to
 * the row type, data source, and card component) keeps the page that renders
 * `<ListView>` tiny — see HelloListKit.tsx.
 */
export const productsConfig = defineListConfig<Product>({
	id: 'products',
	title: 'Productos',
	subtitle: 'Demostración de listkit — todos los tipos de filtro',
	pageSize: 8,
	// Custom brand theme (a ThemeClasses object), not one of the 8 built-ins.
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
				},
				{
					id: 'stock',
					field: 'stock',
					label: 'Existencias',
					type: 'number-range',
				},
				{
					id: 'createdAt',
					field: 'createdAt',
					label: 'Fecha de alta',
					type: 'date-range',
				},
				{
					id: 'inStock',
					field: 'inStock',
					label: 'Disponibilidad',
					type: 'boolean',
					trueLabel: 'En stock',
					falseLabel: 'Agotado',
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
