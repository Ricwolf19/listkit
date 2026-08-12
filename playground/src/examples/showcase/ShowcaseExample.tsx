import { ListView, type PaginationVariant } from 'listkit'
import { useState } from 'react'

import { ExampleShell, type Legend } from '../../shell/ExampleShell'
import { Hint } from '../../shell/Hint'
import { Segmented } from '../../shell/Segmented'
import { showcaseConfig } from './config'
import { TICKETS } from './data'

const VARIANT_HINT: Record<PaginationVariant, string> = {
	sticky:
		'Default. Flota en el flujo — no necesita offset ni reserva de padding.',
	fixed: 'Clavada al viewport. Con sidebar de app, pasa paginationOffsetLeft.',
	inline:
		'Estática al fondo del contenedor. Se queda abajo aunque la lista quede corta.',
}

const LEGENDS: Legend[] = [
	{
		action: 'Usa las pills bajo el buscador',
		expect:
			'cada una abre su input real en un popover — los 6 tipos de filtro, sin ir al sidebar.',
	},
	{
		action: 'Abre el sidebar de filtros',
		expect: 'los mismos filtros, agrupados en cuatro secciones.',
	},
	{
		action: 'Aplica un filtro y reabre el sidebar',
		expect:
			'el filtro aplicado encabeza su sección y su sección sube al inicio.',
	},
	{
		action: 'Fíjate en Origen y Otros',
		expect:
			'las secciones largas sin usar arrancan colapsadas; nunca una que tenga un filtro aplicado.',
	},
	{
		action: 'Escribe en el buscador de filtros',
		expect: 'aparece al pasar de 6 filtros y acota el sidebar.',
	},
	{
		action: 'Prueba los sliders de Horas y Satisfacción',
		expect:
			'un number-range con display slider, y su chip lee por formatValue.',
	},
	{
		action: 'Teclea 1,500,000 en un number-range',
		expect:
			'acepta separadores; un límite a medio escribir («-») deja la lista sin filtrar.',
	},
	{
		action: 'Presiona +',
		expect: 'abre un filtro rápido ya listo para usarse; − quita el último.',
	},
	{
		action: 'Presiona ? y luego Shift+V',
		expect: 'el overlay lista los atajos; Shift+V alterna tabla y tarjetas.',
	},
	{
		action: 'Shift + ← / →',
		expect: 'salta a la primera y la última página.',
	},
	{
		action: 'Cambia la variante de paginación',
		expect:
			'sticky flota, fixed se clava al viewport, inline se queda al fondo.',
	},
	{
		action: 'Filtra hasta no encontrar nada',
		expect: 'aparece el empty state con título y mensaje propios.',
	},
]

/**
 * In-memory showcase: every filter type as a quick pill and in the sidebar,
 * the three pagination layouts, sticky columns, and a custom empty state.
 */
export function ShowcaseExample() {
	const [variant, setVariant] = useState<PaginationVariant>('sticky')

	return (
		<ExampleShell
			title='Filtros'
			subtitle='Los 6 tipos que listkit soporta, cada uno como pill rápida y en el sidebar, sobre 240 tickets en memoria.'
			legends={LEGENDS}
			controls={
				<>
					<Segmented
						value={variant}
						onChange={setVariant}
						options={[
							{ value: 'sticky', label: 'sticky' },
							{ value: 'fixed', label: 'fixed' },
							{ value: 'inline', label: 'inline' },
						]}
					/>
					<Hint>{VARIANT_HINT[variant]}</Hint>
				</>
			}
		>
			<div className='flex min-h-[70vh] flex-col'>
				<ListView
					config={showcaseConfig}
					data={TICKETS}
					paginationVariant={variant}
				/>
			</div>
		</ExampleShell>
	)
}
