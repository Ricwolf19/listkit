import {
	type BuiltInColorTheme,
	DEFAULT_LABELS,
	defineListConfig,
	ES_LABELS,
	ListKitProvider,
	ListView,
} from 'listkit'
import { useMemo, useState } from 'react'

import { ExampleShell, type Legend } from '../../shell/ExampleShell'
import { Hint } from '../../shell/Hint'
import { Segmented } from '../../shell/Segmented'
import {
	formatMoney,
	type Invoice,
	INVOICE_STATUSES,
	INVOICES,
} from '../invoices/data'

const THEMES: BuiltInColorTheme[] = [
	'blue',
	'red',
	'green',
	'yellow',
	'purple',
	'pink',
	'orange',
	'teal',
]

/** Swatch per palette, so the picker itself shows what it selects. */
const SWATCH: Record<BuiltInColorTheme, string> = {
	blue: 'bg-blue-500',
	red: 'bg-red-500',
	green: 'bg-green-500',
	yellow: 'bg-yellow-500',
	purple: 'bg-purple-500',
	pink: 'bg-pink-500',
	orange: 'bg-orange-500',
	teal: 'bg-teal-500',
}

const LEGENDS: Legend[] = [
	{
		action: 'Cambia de paleta',
		expect:
			'se tiñen el foco del buscador, los chips de filtro activo, la vista activa y la paginación — no el texto de las celdas.',
	},
	{
		action: 'Cambia el idioma a English',
		expect:
			'cada string de la UI viene de labels; el contenido de las filas es dato, y no se traduce.',
	},
	{
		action: 'Aplica un filtro y luego cambia la paleta',
		expect: 'el chip activo se retiñe sin perder el filtro ni la página.',
	},
	{
		action: 'Fíjate en cómo se anida el provider',
		expect:
			'este demo monta su propio ListKitProvider dentro del de la app; hereda el router y sólo pisa theme y labels.',
	},
	{
		action: 'Compara yellow contra blue en los chips',
		expect:
			'es la revisión de contraste que justifica tener el selector — algunas paletas son más débiles sobre blanco.',
	},
]

export function ThemingExample() {
	const [theme, setTheme] = useState<BuiltInColorTheme>('blue')
	const [lang, setLang] = useState<'es' | 'en'>('es')

	const config = useMemo(
		() =>
			defineListConfig<Invoice>({
				id: 'theming',
				title: lang === 'es' ? 'Facturas' : 'Invoices',
				pageSize: 10,
				search: { fields: ['number', 'customer.name'] },
				getItemKey: i => i.id,
				selection: true,
				table: {
					columns: [
						{
							key: 'number',
							header: lang === 'es' ? 'Folio' : 'Number',
							sortable: true,
						},
						{
							key: 'customer.name',
							header: lang === 'es' ? 'Cliente' : 'Customer',
							grow: true,
						},
						{
							key: 'status',
							header: lang === 'es' ? 'Estado' : 'Status',
						},
						{
							key: 'total',
							header: 'Total',
							align: 'right',
							sortable: true,
							render: i => formatMoney(i.total, i.currency),
						},
					],
				},
				filters: [
					{
						id: 'main',
						title: lang === 'es' ? 'Estado' : 'Status',
						filters: [
							{
								id: 'status',
								field: 'status',
								label: lang === 'es' ? 'Estado' : 'Status',
								type: 'select',
								options: INVOICE_STATUSES.map(v => ({ value: v, label: v })),
								quick: true,
							},
						],
					},
				],
			}),
		[lang]
	)

	return (
		<ExampleShell
			title='Temas e i18n'
			subtitle='Una sola lista bajo las 8 paletas y los dos juegos de labels que el paquete envía, para revisar contraste y strings sin recompilar.'
			legends={LEGENDS}
			controls={
				<>
					<div className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm'>
						{THEMES.map(name => (
							<button
								key={name}
								type='button'
								onClick={() => setTheme(name)}
								aria-label={name}
								aria-pressed={theme === name}
								title={name}
								className={`h-6 w-6 cursor-pointer rounded-md transition-transform ${SWATCH[name]} ${
									theme === name
										? 'scale-110 ring-2 ring-gray-900 ring-offset-1'
										: 'opacity-60 hover:opacity-100'
								}`}
							/>
						))}
					</div>
					<Segmented
						value={lang}
						onChange={setLang}
						options={[
							{ value: 'es', label: 'ES_LABELS' },
							{ value: 'en', label: 'DEFAULT_LABELS' },
						]}
					/>
					<Hint>
						Paleta activa: <code>{theme}</code>
					</Hint>
				</>
			}
		>
			{/* Nested inside the app's provider: inherits the router and overrides
			    only theme and labels — the pattern ListKitProvider documents. */}
			<ListKitProvider
				theme={theme}
				labels={lang === 'es' ? ES_LABELS : DEFAULT_LABELS}
			>
				<ListView
					config={config}
					data={INVOICES.slice(0, 80)}
					paginationVariant='inline'
				/>
			</ListKitProvider>
		</ExampleShell>
	)
}
