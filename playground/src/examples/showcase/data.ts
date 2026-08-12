export const TICKET_STATUSES = [
	'Abierto',
	'En progreso',
	'Bloqueado',
	'Cerrado',
] as const

export const AREAS = ['Soporte', 'Ventas', 'Logística', 'Finanzas'] as const

export const TAGS = [
	'urgente',
	'regresión',
	'cliente VIP',
	'facturación',
	'envío',
] as const

/** One row type carrying every filterable shape listkit supports. */
export type Ticket = {
	id: string
	folio: string
	/** `text` filter. */
	subject: string
	/** `select` filter. */
	status: (typeof TICKET_STATUSES)[number]
	/** `select` filter over a nested path. */
	requester: { name: string; area: (typeof AREAS)[number] }
	/** `multi-select` over an array of scalars. */
	tags: string[]
	/** `multi-select` over an array-crossing path. */
	replies: { author: string; channel: string }[]
	/** `number-range` filter (plain inputs). */
	hoursOpen: number
	/** `number-range` filter rendered as a slider. */
	satisfaction: number
	/** `date-range` filter. */
	createdAt: string
	/** `boolean` filter. */
	escalated: boolean
}

const SUBJECTS = [
	'No puedo iniciar sesión',
	'Cobro duplicado en la factura',
	'El envío llegó incompleto',
	'Solicitud de devolución',
	'Error al generar el CFDI',
	'Cambio de dirección fiscal',
	'La app se cierra al exportar',
]
const PEOPLE = [
	'Ana Pérez',
	'José Núñez',
	'Marta Ñito',
	'Luis Cárdenas',
	'Sofía Álvarez',
]
export const CHANNEL_OPTIONS = ['correo', 'teléfono', 'chat'] as const
const CHANNELS = CHANNEL_OPTIONS

/** Deterministic rows — no Math.random, so reloads look the same. */
export const TICKETS: Ticket[] = Array.from({ length: 240 }, (_, i) => {
	const month = String((i % 12) + 1).padStart(2, '0')
	const day = String((i % 27) + 1).padStart(2, '0')
	return {
		id: `ticket-${i + 1}`,
		folio: `TK-${2000 + i}`,
		subject: SUBJECTS[i % SUBJECTS.length]!,
		status: TICKET_STATUSES[i % TICKET_STATUSES.length]!,
		requester: {
			name: PEOPLE[i % PEOPLE.length]!,
			area: AREAS[i % AREAS.length]!,
		},
		tags: [TAGS[i % TAGS.length]!, TAGS[(i + 2) % TAGS.length]!],
		replies: Array.from({ length: (i % 3) + 1 }, (_, r) => ({
			author: PEOPLE[(i + r) % PEOPLE.length]!,
			channel: CHANNELS[(i + r) % CHANNELS.length]!,
		})),
		hoursOpen: (i * 7) % 180,
		satisfaction: i % 6,
		createdAt: `2026-${month}-${day}`,
		escalated: i % 4 === 0,
	}
})
