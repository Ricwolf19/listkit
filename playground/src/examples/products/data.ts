import { CATEGORIES, type Product, TAGS } from './types'

const daysAgo = (n: number) => {
	const d = new Date()
	d.setDate(d.getDate() - n)
	return d.toISOString().slice(0, 10)
}

export const PRODUCTS: Product[] = Array.from({ length: 47 }, (_, i) => {
	const stock = Math.floor(Math.random() * 200)
	return {
		id: `p-${i + 1}`,
		name: `Producto ${i + 1}`,
		sku: `SKU-${1000 + i}`,
		category: CATEGORIES[i % CATEGORIES.length]!,
		tags: TAGS.filter(() => Math.random() > 0.6),
		stock,
		price: Math.round((5 + Math.random() * 95) * 100) / 100,
		inStock: stock > 0,
		createdAt: daysAgo(Math.floor(Math.random() * 365)),
	}
})
