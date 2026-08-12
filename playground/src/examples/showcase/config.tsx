import { defineListConfig } from 'listkit'
import { Copy, Eye, User, UserPlus } from 'lucide-react'

import {
	AREAS,
	CHANNEL_OPTIONS,
	TAGS,
	type Ticket,
	TICKET_STATUSES,
} from './data'

const opt = (v: string) => ({ value: v, label: v })

/**
 * Every filter type listkit ships, each surfaced **both** as a quick pill and
 * in the sidebar — the reference for what a `quick` filter can be.
 *
 * The sidebar is split into four sections on purpose: past three sections the
 * auto-collapse rule kicks in, so you can watch long untouched sections start
 * closed while a section holding an applied filter stays open and floats to
 * the top.
 */
export const showcaseConfig = defineListConfig<Ticket>({
	id: 'showcase',
	title: 'Todos los tipos de filtro',
	subtitle:
		'Los 6 tipos, como pill rápida y en el sidebar. Prueba ? para los atajos.',
	pageSize: 20,
	search: { fields: ['folio', 'subject', 'requester.name'] },
	searchPlaceholder: 'Buscar por folio, asunto o solicitante…',
	defaultSort: { field: 'createdAt', dir: 'desc' },
	getItemKey: ticket => ticket.id,
	selection: true,

	empty: {
		title: 'Ningún ticket coincide',
		message: 'Prueba quitando un filtro o ampliando el rango de fechas.',
	},

	// Declarative actions column: listkit appends it, pins it right, keeps it
	// out of the export, and renders the ••• menu. `quick` actions slide out on
	// hover beside the •••; `group` titles the menu sections.
	rowActions: [
		{
			label: 'Ver detalle',
			icon: <Eye className='h-4 w-4' />,
			quick: true,
			group: 'Acciones',
			onClick: t => alert(`Abrir ${t.folio}`),
		},
		{
			label: 'Asignar',
			icon: <UserPlus className='h-4 w-4' />,
			quick: true,
			group: 'Acciones',
			onClick: t => alert(`Asignar ${t.folio}`),
		},
		{
			label: 'Copiar folio',
			icon: <Copy className='h-4 w-4' />,
			group: 'Acciones',
			onClick: t => navigator.clipboard.writeText(t.folio),
		},
		{
			label: 'Ver solicitante',
			icon: <User className='h-4 w-4' />,
			group: 'Conexiones',
			onClick: t => alert(`Perfil de ${t.requester.name}`),
		},
		{
			label: 'Cerrar ticket',
			danger: true,
			group: 'Acciones',
			onClick: t => alert(`Cerrar ${t.folio}`),
			disabled: t => t.status === 'Cerrado' && 'Ya está cerrado',
		},
	],

	filtersTitle: 'Filtrar tickets',
	filters: [
		{
			id: 'basics',
			title: 'Básicos',
			filters: [
				{
					// text — popover with the input + match mode
					id: 'subject',
					field: 'subject',
					label: 'Asunto',
					type: 'text',
					placeholder: 'Contiene…',
					quick: true,
				},
				{
					// select — popover with a searchable select
					id: 'status',
					field: 'status',
					label: 'Estado',
					type: 'select',
					options: TICKET_STATUSES.map(opt),
					quick: true,
				},
				{
					// boolean — cycles in place, no popover
					id: 'escalated',
					field: 'escalated',
					label: 'Escalado',
					type: 'boolean',
					trueLabel: 'Sí',
					falseLabel: 'No',
					quick: true,
				},
			],
		},
		{
			id: 'people',
			title: 'Personas',
			filters: [
				{
					// select over a nested object path
					id: 'area',
					field: 'requester.area',
					label: 'Área',
					type: 'select',
					options: AREAS.map(opt),
					quick: true,
				},
				{
					// multi-select over an array of scalars
					id: 'tags',
					field: 'tags',
					label: 'Etiquetas',
					type: 'multi-select',
					options: TAGS.map(opt),
					quick: true,
				},
				{
					// multi-select over an array-crossing path: matches when ANY
					// reply used that channel
					id: 'replyChannel',
					field: 'replies.channel',
					label: 'Canal de respuesta',
					type: 'multi-select',
					options: CHANNEL_OPTIONS.map(opt),
					quick: true,
				},
			],
		},
		{
			id: 'ranges',
			title: 'Rangos',
			filters: [
				{
					// number-range — two inputs
					id: 'hoursOpen',
					field: 'hoursOpen',
					label: 'Horas abierto',
					type: 'number-range',
					quick: true,
				},
				{
					// number-range as a dual-thumb slider
					id: 'satisfaction',
					field: 'satisfaction',
					label: 'Satisfacción',
					type: 'number-range',
					display: 'slider',
					min: 0,
					max: 5,
					step: 1,
					formatValue: n => `${n}★`,
				},
				{
					// date-range
					id: 'createdAt',
					field: 'createdAt',
					label: 'Creado',
					type: 'date-range',
					quick: true,
				},
			],
		},
		{
			// A long section with nothing applied: watch it start collapsed.
			id: 'extra',
			title: 'Avanzados (arranca colapsada)',
			filters: [
				{
					id: 'statusPinned',
					field: 'status',
					label: 'Solo bloqueados',
					type: 'select',
					options: TICKET_STATUSES.map(opt),
					pinned: true,
					pinnedValue: 'Bloqueado',
				},
				{ id: 'a1', field: 'folio', label: 'Folio', type: 'text' },
				{
					id: 'a2',
					field: 'requester.name',
					label: 'Solicitante',
					type: 'text',
				},
				{ id: 'a3', field: 'subject', label: 'Asunto exacto', type: 'text' },
				{
					id: 'a4',
					field: 'hoursOpen',
					label: 'Horas (otra vez)',
					type: 'number-range',
				},
				{
					id: 'a5',
					field: 'satisfaction',
					label: 'Satisfacción (inputs)',
					type: 'number-range',
				},
			],
		},
	],

	table: {
		columns: [
			{
				key: 'folio',
				header: 'Folio',
				sortable: true,
			},
			{ key: 'subject', header: 'Asunto', sortable: true },
			{ key: 'status', header: 'Estado' },
			{ key: 'requester.name', header: 'Solicitante' },
			{ key: 'requester.area', header: 'Área' },
			{ key: 'tags', header: 'Etiquetas' },
			{ key: 'replies.author', header: 'Respuestas' },
			{ key: 'hoursOpen', header: 'Horas', align: 'right', sortable: true },
			{ key: 'satisfaction', header: 'CSAT', align: 'right' },
			{ key: 'createdAt', header: 'Creado', sortable: true },
			{ key: 'escalated', header: 'Escalado' },
		],
	},

	export: {
		fileName: 'tickets',
		groups: [
			{ id: 'ticket', label: 'Ticket' },
			{ id: 'persona', label: 'Persona' },
		],
		fields: [
			{ key: 'folio', label: 'Folio', group: 'ticket' },
			{ key: 'subject', label: 'Asunto', group: 'ticket' },
			{ key: 'status', label: 'Estado', group: 'ticket' },
			{ key: 'createdAt', label: 'Creado', group: 'ticket' },
			{ key: 'escalated', label: 'Escalado', group: 'ticket' },
			{ key: 'hoursOpen', label: 'Horas abierto', group: 'ticket' },
			{ key: 'requester.name', label: 'Solicitante', group: 'persona' },
			{ key: 'requester.area', label: 'Área', group: 'persona' },
			{ key: 'tags', label: 'Etiquetas', group: 'persona' },
			{ key: 'replies.author', label: 'Respondieron', group: 'persona' },
			{ key: 'replies.channel', label: 'Canales', group: 'persona' },
		],
	},
})
