import { ListView } from '@pibytelabs/listkit'
import { Plus } from 'lucide-react'

import { productsConfig } from './products/config'
import { PRODUCTS } from './products/data'

/**
 * Best-practice structure: the row type, data source, card component, and the
 * `defineListConfig` all live in `./products/*`. The page just wires the config
 * to its data — so adding a list view stays a one-liner.
 */
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
