// Postgres-flavoured helpers ($n placeholders, lower(), NULLS LAST) for turning
// listkit filter/sort values into safe SQL. Opt-in and minimal — compose them,
// don't expect a full query builder. Pair with `@pibytelabs/listkit/query`.
import type { TextValue } from './query'
import type { ListQuery } from './types/data'

// Safe `ORDER BY` body: the column text only ever comes from `allowed` (a
// whitelist), never user input. `sort.dir` is pre-validated by listkit.
// `tiebreak` (e.g. `', id DESC'`) keeps paginated order deterministic on ties.
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

// Builds a `lower(col) LIKE`/`= $n` condition from a text filter, pushing the
// bound value onto `params` so placeholder indexes stay in sync. Returns null
// when the filter is empty.
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
