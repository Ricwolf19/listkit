import { defineListConfig, ListView } from '@pibytelabs/listkit'
import { Pencil, Plus, Trash2 } from 'lucide-react'

type Product = {
	id: string
	name: string
	sku: string
	category: string
	stock: number
	price: number
}

const PRODUCTS: Product[] = Array.from({ length: 47 }, (_, i) => {
	const categories = ['Café', 'Té', 'Accesorios', 'Repostería']
	return {
		id: `p-${i + 1}`,
		name: `Producto ${i + 1}`,
		sku: `SKU-${1000 + i}`,
		category: categories[i % categories.length]!,
		stock: Math.floor(Math.random() * 200),
		price: Math.round((5 + Math.random() * 95) * 100) / 100,
	}
})

const currency = (n: number) =>
	new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
		n
	)

const productsConfig = defineListConfig<Product>({
	id: 'products',
	title: 'Productos',
	subtitle: 'Demostración de listkit v0.1 (datos en memoria)',
	pageSize: 8,
	colorTheme: 'red',
	searchPlaceholder: 'Buscar por nombre, SKU o categoría...',
	emptyMessage: 'No se encontraron productos',
	search: { fields: ['name', 'sku', 'category'] },
	sort: data => [...data].sort((a, b) => a.name.localeCompare(b.name)),
	getItemKey: item => item.id,
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
	card: (item, ctx) => (
		<>
			<div className='mb-3 flex items-start justify-between'>
				<div className='min-w-0'>
					<h3 className='truncate font-semibold text-gray-900'>{item.name}</h3>
					<p className='text-xs text-gray-500'>{item.sku}</p>
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
	),
})

export function HelloListKit() {
	return (
		<ListView
			config={productsConfig}
			data={PRODUCTS}
			toolbarActions={[
				{
					label: 'Nuevo',
					icon: <Plus size={16} />,
					onClick: () => alert('Nuevo producto'),
				},
			]}
		/>
	)
}
