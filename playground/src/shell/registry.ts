import type { ComponentType } from 'react'

import { ActionsExample } from '../examples/actions/ActionsExample'
import { HelloListKit } from '../examples/HelloListKit'
import { InvoicesExample } from '../examples/invoices/InvoicesExample'
import { OrdersExample } from '../examples/orders/OrdersExample'
import { PrimitivesExample } from '../examples/primitives/PrimitivesExample'
import { ShowcaseExample } from '../examples/showcase/ShowcaseExample'
import { ThemingExample } from '../examples/theming/ThemingExample'

export type Demo = {
	id: string
	/** Sidebar entry. */
	label: string
	/** One line under the label — why you'd open this one. */
	blurb: string
	render: ComponentType
}

export type DemoGroup = {
	title: string
	demos: Demo[]
}

/**
 * Every demo, grouped by the question it answers. Order matters: a reviewer
 * reads top to bottom, so the groups run from "does it work at all" to the
 * narrow surfaces.
 */
export const DEMO_GROUPS: DemoGroup[] = [
	{
		title: 'Datos',
		demos: [
			{
				id: 'showcase',
				label: 'Filtros',
				blurb: 'Los 6 tipos, como pill y en sidebar',
				render: ShowcaseExample,
			},
			{
				id: 'products',
				label: 'Async y cache',
				blurb: 'Adapter con latencia, skeletons, refresh',
				render: HelloListKit,
			},
			{
				id: 'orders',
				label: 'Server y export',
				blurb: 'Scope por cache, export configurable',
				render: OrdersExample,
			},
		],
	},
	{
		title: 'Tabla',
		demos: [
			{
				id: 'invoices',
				label: 'Tabla ancha',
				blurb: '18 columnas, scroll en X, columnas pinned',
				render: InvoicesExample,
			},
		],
	},
	{
		title: 'Acciones',
		demos: [
			{
				id: 'actions',
				label: 'Acciones de fila',
				blurb: 'Quick bar al hover, menú agrupado',
				render: ActionsExample,
			},
		],
	},
	{
		title: 'Presentación',
		demos: [
			{
				id: 'theming',
				label: 'Temas e i18n',
				blurb: 'Paletas y labels EN/ES en vivo',
				render: ThemingExample,
			},
			{
				id: 'primitives',
				label: 'Primitivas sueltas',
				blurb: 'Table, Cards y Pagination sin ListView',
				render: PrimitivesExample,
			},
		],
	},
]

export const DEMOS: Demo[] = DEMO_GROUPS.flatMap(group => group.demos)

export const DEFAULT_DEMO_ID = 'showcase'
