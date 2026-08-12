import type { ExportDateFormat } from '../types/export'
import { warnDev } from '../utils/devWarn'

/** Excel's hard cap on characters per cell; longer content is unreadable there. */
const MAX_CELL_CHARS = 32_767

/** ISO timestamp shape — what `Date`s become after a JSON round-trip. */
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Render a date per {@link ExportDateFormat}. Named formats use local time (or
 * `timeZone` when given) so a row captured at 23:00 GMT-6 keeps its calendar
 * day — `toISOString()` would move it to tomorrow.
 */
export function formatExportDate(
	date: Date,
	format: ExportDateFormat = 'date',
	timeZone?: string
): string {
	if (typeof format === 'function') return format(date)
	if (format === 'iso') return date.toISOString()

	if (timeZone) {
		// en-CA renders YYYY-MM-DD; formatToParts keeps it explicit.
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		}).formatToParts(date)
		const get = (type: string) =>
			parts.find(part => part.type === type)?.value ?? ''
		const day = `${get('year')}-${get('month')}-${get('day')}`
		if (format === 'date') return day
		// `hour12: false` can yield "24" at midnight in some engines.
		const hour = get('hour') === '24' ? '00' : get('hour')
		return `${day} ${hour}:${get('minute')}:${get('second')}`
	}

	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
	if (format === 'date') return day
	return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** Options for {@link normalizeCell}. */
export type NormalizeCellOptions = {
	/** Field key, used to dedupe diagnostics. */
	key: string
	/** Multivalue separator. @defaultValue '; ' */
	join?: string
	/** Date rendering. @defaultValue 'date' */
	date?: ExportDateFormat
	/** `'unix-ms'` renders numbers as dates. @see ExportField.dateCodec */
	dateCodec?: 'unix-ms'
	/** Render named date formats in this IANA zone instead of local time. */
	timeZone?: string
	/** Boolean wording, from the active labels. */
	bool: { yes: string; no: string }
}

/**
 * The single place an export value becomes cell text. Every stack's rows pass
 * through here — in-memory, Mongo, SQL — so a value can never render two ways
 * depending on where it was fetched.
 *
 * Rules: `Date`s (and ISO-timestamp strings, which is what server rows carry
 * after JSON) follow the date format; booleans use the active labels;
 * multivalues join with `'; '`; `data:` URIs are dropped (LK2003) and
 * over-Excel-limit cells truncated (LK2002); non-primitives become empty with
 * a dev warning (LK2001).
 */
export function normalizeCell(
	value: unknown,
	options: NormalizeCellOptions
): string {
	const text = render(value, options)
	if (text.length > MAX_CELL_CHARS) {
		warnDev(
			`LK2002:${options.key}`,
			`[listkit LK2002] export field "${options.key}": cell exceeds Excel's ` +
				`${MAX_CELL_CHARS}-character limit and was truncated.`
		)
		return text.slice(0, MAX_CELL_CHARS)
	}
	return text
}

function render(value: unknown, options: NormalizeCellOptions): string {
	if (value === null || value === undefined) return ''
	if (value instanceof Date) {
		return formatExportDate(value, options.date, options.timeZone)
	}
	if (typeof value === 'boolean') {
		return value ? options.bool.yes : options.bool.no
	}
	if (typeof value === 'number') {
		return options.dateCodec === 'unix-ms'
			? formatExportDate(new Date(value), options.date, options.timeZone)
			: String(value)
	}
	if (typeof value === 'string') {
		if (value.startsWith('data:')) {
			warnDev(
				`LK2003:${options.key}`,
				`[listkit LK2003] export field "${options.key}": data: URI dropped ` +
					`from the cell. Export a plain URL or set exportable: false.`
			)
			return ''
		}
		// A Date that crossed JSON — format it like one so server-fetched rows
		// render identically to in-memory ones.
		if (ISO_TIMESTAMP.test(value)) {
			const time = new Date(value)
			if (!Number.isNaN(time.getTime())) {
				return formatExportDate(time, options.date, options.timeZone)
			}
		}
		return value
	}
	if (Array.isArray(value)) {
		return value
			.map(element => render(element, options))
			.filter(text => text !== '')
			.join(options.join ?? '; ')
	}
	warnDev(
		`LK2001:${options.key}`,
		`[listkit LK2001] export field "${options.key}": value of type ` +
			`"${typeof value}" is not exportable and rendered empty. Provide a ` +
			`value() formatter or set exportable: false.`
	)
	return ''
}
