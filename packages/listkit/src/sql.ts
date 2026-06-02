/**
 * Postgres-flavoured helpers (`$n` placeholders, `lower()`, `NULLS LAST`) for
 * turning listkit filter/sort values into safe SQL fragments. Opt-in and
 * minimal — compose them, don't expect a full query builder. Pair with
 * `@pibytelabs/listkit/query`.
 *
 * @packageDocumentation
 */
import type { TextValue } from './query'
import type { ListQuery } from './types/data'

/**
 * Build a safe `ORDER BY` body from `query.sort`.
 *
 * @remarks
 * The column text only ever comes from `allowed` (a whitelist mapping a sort
 * field to a trusted SQL expression), never from user input — so there is no
 * `ORDER BY` injection. `sort.dir` is already validated by listkit.
 *
 * @param sort - `query.sort`, or undefined.
 * @param allowed - Whitelist: sort field → trusted SQL column expression.
 * @param fallback - `ORDER BY` body used when no/unknown sort is active.
 * @param tiebreak - Appended to a whitelisted sort to keep pagination deterministic on ties (e.g. `', id DESC'`).
 * @returns The `ORDER BY` body (without the `ORDER BY` keyword).
 *
 * @example
 * ```ts
 * const orderBy = buildOrderBy(
 *   query.sort,
 *   { name: 'u.name', created: 'u.created_at' },
 *   'u.id DESC',
 *   ', u.id DESC',
 * )
 * // `SELECT ... ORDER BY ${orderBy}`
 * ```
 */
export const buildOrderBy = (
	sort: ListQuery['sort'],
	allowed: Record<string, string>,
	fallback: string,
	tiebreak = ''
): string => {
	if (sort && Object.prototype.hasOwnProperty.call(allowed, sort.field)) {
		const column = allowed[sort.field]
		const dir = sort.dir === 'desc' ? 'DESC' : 'ASC'
		return `${column} ${dir} NULLS LAST${tiebreak}`
	}
	return fallback
}

/**
 * Build a `lower(col) LIKE`/`= $n` condition from a `text` filter value.
 *
 * @remarks
 * Pushes the bound value onto `params` (mutating it) so the `$n` placeholder
 * index stays in sync with your other conditions. `'partial'` matches use
 * `LIKE %term%`; `'exact'` uses `=`.
 *
 * @param text - The text value from {@link getText}, or `null`.
 * @param column - Trusted SQL column expression (never user input).
 * @param params - The bound-params array; the value is appended to it.
 * @returns The SQL condition, or `null` when `text` is empty.
 *
 * @example
 * ```ts
 * const where: string[] = []
 * const cond = textCondition(getText(byId, 'email'), 'u.email', params)
 * if (cond) where.push(cond)
 * ```
 */
export const textCondition = (
	text: TextValue | null,
	column: string,
	params: unknown[]
): string | null => {
	if (!text) return null
	if (text.match === 'exact') {
		params.push(text.value.toLowerCase())
		return `lower(${column}) = $${params.length}`
	}
	params.push(`%${text.value.toLowerCase()}%`)
	return `lower(${column}) LIKE $${params.length}`
}
