import { type Density, ListView } from 'listkit'
import { useState } from 'react'

import { ExampleShell, type Legend } from '../../shell/ExampleShell'
import { Hint } from '../../shell/Hint'
import { Segmented } from '../../shell/Segmented'
import { invoicesConfig } from './config'
import { INVOICES } from './data'

const LEGENDS: Legend[] = [
	{
		action: 'Scrollea la tabla a la derecha',
		expect:
			'la columna pinned proyecta una sombra oscura hacia el contenido que pasa por debajo — la costura se marca sola y desaparece al llegar al borde.',
	},
	{
		action: 'Mira Folio y la columna de acciones',
		expect:
			'quedan fijas y tapan por completo lo que pasa detrás; sólo la más externa de cada lado carga la sombra.',
	},
	{
		action: 'Pasa el cursor sobre el ••• de una fila',
		expect:
			'las quick actions salen hacia la izquierda, en la misma línea de la fila.',
	},
	{
		action: 'Da clic al •••',
		expect: 'el menú agrupa en Acciones y Conexiones, con título y divisor.',
	},
	{
		action: 'Arrastra el borde derecho de un encabezado',
		expect: 'la columna cambia de ancho y la medida persiste al recargar.',
	},
	{
		action: 'Doble clic en ese mismo borde',
		expect: 'la columna se ajusta al contenido más ancho que tenga visible.',
	},
	{
		action: 'Arrastra un encabezado sobre otro',
		expect: 'las columnas se reordenan y el orden persiste.',
	},
	{
		action: 'Opciones → Columnas',
		expect:
			'revela «Intentos de cobro» y «Notas», ocultas por defecto; Notas usa grow y nunca se trunca.',
	},
	{
		action: 'Compara los dos modos de scroll',
		expect:
			'el default es scroll X natural (la página conserva el vertical); stickyHeader acota el cuerpo a 60vh y pega el encabezado.',
	},
	{
		action: 'Da un flick fuerte en X o Y',
		expect:
			'la tabla no rebota más allá de su borde — sin huecos blancos junto a las columnas pinned.',
	},
	{
		action: 'Selecciona filas y abre Opciones → Exportar',
		expect: 'el diálogo ofrece los grupos Factura / Cliente / Cobranza.',
	},
	{
		action: 'Quita el chip «Vencida»',
		expect:
			'era un filtro pinned con valor predeterminado, no un filtro activo.',
	},
	{
		action: 'Baja la ventana de 1024px',
		expect: 'el pinning se apaga y la vista cambia a tarjetas autogeneradas.',
	},
]

/**
 * The wide-table reference. 18 columns so the table always overflows, and the
 * two scroll modes side by side: the package default (natural horizontal
 * scroll, the page owns vertical) and the opt-in bounded body with a sticky
 * header.
 */
export function InvoicesExample() {
	const [density, setDensity] = useState<Density>('comfortable')
	// Starts on the package default — natural x-scroll, no bounded body — so
	// that mode is validated first; the sticky header is the opt-in.
	const [mode, setMode] = useState<'default' | 'sticky'>('default')

	return (
		<ExampleShell
			title='Facturas'
			subtitle='18 columnas sobre 420 filas — la tabla siempre desborda, que es donde el scroll horizontal y las columnas pinned se ganan el lugar.'
			legends={LEGENDS}
			controls={
				<>
					<Segmented
						value={mode}
						onChange={setMode}
						options={[
							{ value: 'default', label: 'Scroll X (default)' },
							{ value: 'sticky', label: 'stickyHeader (60vh)' },
						]}
					/>
					<Segmented
						value={density}
						onChange={setDensity}
						options={[
							{ value: 'comfortable', label: 'Densidad normal' },
							{ value: 'compact', label: 'Compacta' },
						]}
					/>
					<Hint>
						La densidad también se cambia desde Opciones; la elección del
						usuario gana sobre esta.
					</Hint>
				</>
			}
		>
			<ListView
				// Remounts when the defaults change: they are initial values, and the
				// user's persisted preference wins over them.
				key={`${density}-${mode}`}
				config={{
					...invoicesConfig,
					table: {
						...invoicesConfig.table!,
						defaultDensity: density,
						...(mode === 'sticky' && {
							stickyHeader: true,
							maxBodyHeight: '60vh',
						}),
					},
				}}
				data={INVOICES}
				paginationVariant='inline'
			/>
		</ExampleShell>
	)
}
