/**
 * Postgres-flavoured helpers (`$n` placeholders, `lower()`, `NULLS LAST`) for
 * turning listkit filter/sort values into safe SQL fragments. Opt-in and
 * minimal — compose them, don't expect a full query builder. Pair with
 * `listkit/query`.
 *
 * @packageDocumentation
 */
import {
	filtersById,
	getBoolean,
	getDateRange,
	getNumberRange,
	getString,
	getStringArray,
	getText,
	paginate,
	type TextValue,
} from './query'
import type { ListQuery } from './types/data'
import type { ExportRequest } from './types/export'
import type { FilterSection } from './types/filters'
import { lkError } from './utils/diagnostics'

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

/** Registers a bound param and returns its `$n` placeholder. */
type Placeholder = (value: unknown) => string

/**
 * How a filter `id` maps to a SQL column. A bare string is the trusted column
 * expression (e.g. `'u.email'`); `{ column, build }` overrides the fragment for
 * one column; `{ match }` builds a complete fragment spanning several columns
 * (computed buckets, `EXISTS (...)` joins for many-to-many, etc.). The `build`/
 * `match` callbacks receive a `p(value)` that registers a bound param and returns
 * its `$n`, so placeholder numbering stays correct.
 */
export type SqlFieldSpec =
	| string
	| {
			/** Trusted SQL column expression. */
			column: string
			/** Override the fragment for this column. Return `null` to skip. */
			build?: (value: unknown, column: string, p: Placeholder) => string | null
	  }
	| {
			/** Build a complete fragment (one or more columns). Return `null` to skip. */
			match: (value: unknown, p: Placeholder) => string | null
	  }
	| {
			/**
			 * Filter through a to-many relation: the row matches when ANY related
			 * row does (an `EXISTS (...)` subquery), which is how the in-memory and
			 * Mongo engines treat an array-crossing path like `products.name`.
			 */
			relation: SqlRelation
	  }

/**
 * A to-many relation reachable from the main table — the SQL counterpart of an
 * array-of-objects path. Filtering emits `EXISTS (...)`; exporting aggregates
 * the related values into one array cell (`array_agg`), which the shared cell
 * renderer joins exactly like the other stacks' arrays.
 */
export type SqlRelation = {
	/** Related table (optionally aliased), e.g. `'order_item i'`. */
	table: string
	/** Join condition back to the main table, e.g. `'i.order_id = o.id'`. */
	on: string
	/** Column read from the relation, e.g. `'i.product_name'`. */
	column: string
	/**
	 * `ORDER BY` body for the aggregated values — keep it the array's storage
	 * order (a position column) so cells read identically to the other stacks.
	 * @defaultValue the relation `column`
	 */
	orderBy?: string
}

/**
 * Whitelist mapping each filter `id` to a trusted SQL column. Filters whose `id`
 * is absent are ignored, so a client can never reach an unlisted column.
 */
export type SqlFieldMap = Record<string, SqlFieldSpec>

const sqlCondition = (
	type: string,
	column: string,
	byId: Map<string, unknown>,
	id: string,
	p: Placeholder
): string | null => {
	switch (type) {
		case 'text': {
			const t = getText(byId, id)
			if (!t) return null
			return t.match === 'exact'
				? `lower(${column}) = ${p(t.value.toLowerCase())}`
				: `lower(${column}) LIKE ${p(`%${t.value.toLowerCase()}%`)}`
		}
		case 'select': {
			const v = getString(byId, id)
			return v == null ? null : `${column} = ${p(v)}`
		}
		case 'multi-select': {
			const v = getStringArray(byId, id)
			return v == null ? null : `${column} = ANY(${p(v)})`
		}
		case 'boolean': {
			const v = getBoolean(byId, id)
			return v == null ? null : `${column} = ${p(v)}`
		}
		case 'number-range': {
			const r = getNumberRange(byId, id)
			const parts: string[] = []
			if (typeof r.min === 'number') parts.push(`${column} >= ${p(r.min)}`)
			if (typeof r.max === 'number') parts.push(`${column} <= ${p(r.max)}`)
			return parts.length ? parts.join(' AND ') : null
		}
		case 'date-range': {
			const r = getDateRange(byId, id)
			const parts: string[] = []
			if (r.from) parts.push(`${column} >= ${p(r.from)}`)
			if (r.to) {
				// A bare `YYYY-MM-DD` upper bound is inclusive of the whole day.
				const to = r.to.length <= 10 ? `${r.to} 23:59:59.999` : r.to
				parts.push(`${column} <= ${p(to)}`)
			}
			return parts.length ? parts.join(' AND ') : null
		}
		default: {
			const v = byId.get(id)
			return v == null || v === '' ? null : `${column} = ${p(v)}`
		}
	}
}

/**
 * Translate the applied advanced filters into a SQL `WHERE` body (the conditions
 * joined by `AND`, without the `WHERE` keyword), appending the bound values to
 * `params` so the `$n` numbering stays in sync with anything else you push.
 *
 * @remarks
 * Matching mirrors the in-memory adapter: `text` → `lower() LIKE`/`=`, `select`/
 * `boolean` → equality, `multi-select` → `= ANY()`, ranges → `>=`/`<=`. Columns
 * come only from `fields` (no SQL injection). Returns `''` when nothing applies.
 *
 * @param query - The incoming list query.
 * @param fields - Whitelist: filter `id` → trusted column (or `build`/`match`).
 * @param params - Bound-params array; appended to in place.
 * @returns The `AND`-joined conditions, or `''`.
 *
 * @example
 * ```ts
 * const params: unknown[] = []
 * const where = buildSqlFilter(query, {
 *   status: 'p.status',
 *   price: 'p.price',
 *   colors: { match: (v, p) => Array.isArray(v) && v.length
 *     ? `EXISTS (SELECT 1 FROM product_color j WHERE j.sku = p.sku AND j.id = ANY(${p(v.map(Number))}::int[]))`
 *     : null },
 * }, params)
 * const sql = `SELECT * FROM product p ${where ? `WHERE ${where}` : ''}`
 * ```
 */
export const buildSqlFilter = (
	query: ListQuery,
	fields: SqlFieldMap,
	params: unknown[]
): string => {
	const byId = filtersById(query)
	const p: Placeholder = value => `$${params.push(value)}`
	const clauses: string[] = []

	for (const filter of query.filters ?? []) {
		const spec = fields[filter.id]
		if (!spec) continue

		let clause: string | null
		if (typeof spec === 'object' && 'match' in spec) {
			clause = spec.match(byId.get(filter.id), p)
		} else if (typeof spec === 'object' && 'relation' in spec) {
			// ANY-element semantics through the relation, like the other engines.
			const { table, on, column } = spec.relation
			const inner = sqlCondition(filter.type, column, byId, filter.id, p)
			clause = inner
				? `EXISTS (SELECT 1 FROM ${table} WHERE ${on} AND ${inner})`
				: null
		} else {
			const column = typeof spec === 'string' ? spec : spec.column
			const build = typeof spec === 'string' ? undefined : spec.build
			clause = build
				? build(byId.get(filter.id), column, p)
				: sqlCondition(filter.type, column, byId, filter.id, p)
		}
		if (clause) clauses.push(`(${clause})`)
	}

	return clauses.join(' AND ')
}

/**
 * Build a case-insensitive free-text `WHERE` body matching `term` across several
 * columns (`lower(col) LIKE $n OR …`), appending the single bound value to
 * `params`. Returns `''` when the term is empty or there are no columns.
 *
 * @param term - The search term (`query.search`).
 * @param columns - Trusted column expressions to match against.
 * @param params - Bound-params array; appended to in place.
 * @returns The OR-joined search condition wrapped in parens, or `''`.
 */
export const buildSearch = (
	term: string | undefined,
	columns: string[],
	params: unknown[]
): string => {
	const t = term?.trim()
	if (!t || columns.length === 0) return ''
	const ph = `$${params.push(`%${t.toLowerCase()}%`)}`
	return `(${columns.map(c => `lower(${c}) LIKE ${ph}`).join(' OR ')})`
}

/**
 * Derive a {@link SqlFieldMap} from a list config's `filters` — a starting point
 * mapping each filter `id` to its `field`. Override entries where the SQL column
 * differs from the field name (snake_case, table alias, joins).
 *
 * @typeParam T - The row type.
 * @param filters - The list config's filter sections.
 * @returns A field map of `id` → `field`.
 */
export const sqlFieldMapFromFilters = <T = unknown>(
	filters: FilterSection<T>[]
): SqlFieldMap => {
	const map: SqlFieldMap = {}
	for (const section of filters) {
		for (const f of section.filters) map[f.id] = f.field
	}
	return map
}

/**
 * A minimal Postgres pool/client: a parameterized `query` returning `{ rows }`.
 * `node-postgres` (`pg`), `@vercel/postgres`, `@neondatabase/serverless`, and
 * similar clients all satisfy it — no driver dependency, just structural typing.
 */
export type SqlPool = {
	query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }>
}

/** Options for {@link executeSqlList}. */
export type ExecuteSqlListConfig = {
	/** The Postgres pool/client to run the two queries on. */
	pool: SqlPool
	/** Table (optionally aliased), e.g. `'company c'`. */
	table: string
	/** The incoming list query. */
	query: ListQuery
	/** Whitelist: filter `id` → trusted column (see {@link sqlFieldMapFromFilters}). */
	fields: SqlFieldMap
	/** SELECT list. @defaultValue '*' */
	columns?: string
	/** Columns the free-text search term matches against. */
	searchColumns?: string[]
	/** Sort whitelist: sort field → trusted column expression. */
	sort?: Record<string, string>
	/** `ORDER BY` body used when no/unknown sort is active (e.g. `'created_at DESC'`). */
	fallbackSort: string
	/** Tiebreaker appended to a whitelisted sort for deterministic paging (e.g. `', id DESC'`). */
	tiebreak?: string
	/** Extra equality conditions merged into every query (auth scope, tenant id). */
	scope?: Record<string, unknown>
	/** Upper bound for `pageSize`. @defaultValue 100 */
	maxPageSize?: number
}

/**
 * Run the paginated `SELECT` + `COUNT` for a listkit list against Postgres,
 * returning the `{ data, total }` shape a data adapter expects — search, filters,
 * scope, sort, and pagination assembled with correct `$n` numbering.
 *
 * @typeParam T - The row type.
 * @param config - Pool, table, query, and the field/sort whitelists.
 * @returns The page rows and the total matching count.
 *
 * @example
 * ```ts
 * const { data, total } = await executeSqlList<Discount>({
 *   pool,
 *   table: 'discount d',
 *   query: parseListkitQuery(req.query),
 *   fields: { kind: 'd.kind', value: 'd.value', created: 'd.created_at' },
 *   searchColumns: ['d.label', 'd.code'],
 *   sort: { label: 'd.label', created: 'd.created_at' },
 *   fallbackSort: 'd.created_at DESC',
 *   tiebreak: ', d.id DESC',
 *   scope: { 'd.tenant_id': tenantId },
 * })
 * ```
 */
export async function executeSqlList<T = Record<string, unknown>>(
	config: ExecuteSqlListConfig
): Promise<{ data: T[]; total: number }> {
	const {
		pool,
		table,
		query,
		fields,
		columns = '*',
		searchColumns = [],
		sort = {},
		fallbackSort,
		tiebreak = '',
		scope = {},
		maxPageSize,
	} = config

	const params: unknown[] = []
	const clauses: string[] = []

	const filterWhere = buildSqlFilter(query, fields, params)
	if (filterWhere) clauses.push(filterWhere)

	const searchWhere = buildSearch(query.search, searchColumns, params)
	if (searchWhere) clauses.push(searchWhere)

	for (const [column, value] of Object.entries(scope)) {
		if (value !== undefined) clauses.push(`${column} = $${params.push(value)}`)
	}

	const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
	const orderBy = buildOrderBy(query.sort, sort, fallbackSort, tiebreak)
	const { pageSize, offset } = paginate(query, maxPageSize)

	const dataSql = `SELECT ${columns} FROM ${table} ${where} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
	const countSql = `SELECT COUNT(*)::int AS count FROM ${table} ${where}`

	const [dataRes, countRes] = await Promise.all([
		pool.query(dataSql, [...params, pageSize, offset]),
		pool.query(countSql, params),
	])

	const total = (countRes.rows[0] as { count?: number } | undefined)?.count ?? 0
	return { data: dataRes.rows as T[], total }
}

/** Options for {@link buildSqlExport}. */
export type SqlExportConfig = {
	/** Main table (optionally aliased), e.g. `'orders o'`. */
	table: string
	/** Whitelist for advanced filters — the same map the list endpoint uses. */
	fields: SqlFieldMap
	/**
	 * Whitelist: export field key → trusted SELECT expression, or a
	 * `{ relation }` aggregated into one array cell. Keys absent here are
	 * skipped — a request can never select an unlisted column. Each expression
	 * is aliased with its field key, which is how the shared CSV assembler
	 * finds it on the returned rows.
	 */
	exportColumns: Record<string, string | { relation: SqlRelation }>
	/** Columns the free-text search matches against. */
	searchColumns?: string[]
	/** Sort whitelist: sort field → trusted column expression. */
	sort?: Record<string, string>
	/**
	 * `ORDER BY` body when no sort is active. Include a unique column
	 * (`'created_at DESC, id DESC'`): without a total order a long export can
	 * duplicate or skip rows.
	 */
	fallbackSort: string
	/** Unique-column suffix appended to a whitelisted sort, e.g. `', o.id'`. */
	tiebreak: string
	/** Column the selection keys refer to, e.g. `'o.id'`. */
	idColumn: string
	/** Extra equality conditions merged in (tenant, auth scope). */
	scope?: Record<string, unknown>
	/** Row ceiling for `all`/`selected` scopes. @defaultValue 50_000 */
	maxRows?: number
	/** Upper bound for `pageSize` on `scope: 'page'`. @defaultValue 100 */
	maxPageSize?: number
}

/**
 * Translate an `ExportRequest` into one parameterized Postgres `SELECT`: the
 * query's filters + search + the request's key selection in `WHERE`, only the
 * whitelisted export columns in `SELECT` (relations aggregated with
 * `array_agg`), a total-order `ORDER BY`, and the scope's `LIMIT`.
 *
 * @remarks
 * Key lists bind as a single `= ANY($n)` parameter — an `IN ($1, $2, …)` with
 * thousands of keys overruns the driver's 65 535-parameter limit. Rows come
 * back with each field key as its column alias; hand them to
 * `rowsToCsvFields`, which renders them identically to every other stack.
 *
 * @example
 * ```ts
 * const request = parseExportRequest(req.body, { fields: EXPORT_KEYS })
 * if (!request) return res.status(400).end()
 * const { sql, params } = buildSqlExport(request, {
 *   table: 'orders o',
 *   fields: FIELDS,
 *   exportColumns: {
 *     folio: 'o.folio',
 *     'products.name': {
 *       relation: { table: 'order_item i', on: 'i.order_id = o.id', column: 'i.product_name', orderBy: 'i.pos' },
 *     },
 *   },
 *   fallbackSort: 'o.created_at DESC, o.id DESC',
 *   tiebreak: ', o.id',
 *   idColumn: 'o.id',
 * })
 * const { rows } = await pool.query(sql, params)
 * ```
 */
export const buildSqlExport = (
	request: ExportRequest,
	config: SqlExportConfig
): { sql: string; params: unknown[] } => {
	const params: unknown[] = []
	const clauses: string[] = []

	const filterWhere = buildSqlFilter(request.query, config.fields, params)
	if (filterWhere) clauses.push(filterWhere)

	const searchWhere = buildSearch(
		request.query.search,
		config.searchColumns ?? [],
		params
	)
	if (searchWhere) clauses.push(searchWhere)

	for (const [column, value] of Object.entries(config.scope ?? {})) {
		if (value !== undefined) clauses.push(`${column} = $${params.push(value)}`)
	}

	if (request.scope === 'selected' && request.includeKeys?.length) {
		clauses.push(
			`${config.idColumn} = ANY($${params.push(request.includeKeys)})`
		)
	} else if (request.excludeKeys?.length) {
		clauses.push(
			`NOT (${config.idColumn} = ANY($${params.push(request.excludeKeys)}))`
		)
	}

	const select: string[] = []
	for (const key of request.fields) {
		if (!Object.prototype.hasOwnProperty.call(config.exportColumns, key)) {
			continue
		}
		const spec = config.exportColumns[key]!
		// The field key doubles as the column alias the CSV assembler reads.
		const alias = `"${key.replace(/"/g, '""')}"`
		if (typeof spec === 'string') {
			select.push(`${spec} AS ${alias}`)
		} else {
			const { table, on, column, orderBy } = spec.relation
			select.push(
				`(SELECT array_agg(${column} ORDER BY ${orderBy ?? column}) ` +
					`FROM ${table} WHERE ${on}) AS ${alias}`
			)
		}
	}
	if (select.length === 0) {
		lkError(
			'LK1003',
			`export request selects no known column. Declare the field keys in ` +
				`exportColumns (got: ${request.fields.join(', ')}).`
		)
		select.push(`${config.idColumn} AS "__lk_id"`)
	}

	const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
	const orderBy = buildOrderBy(
		request.query.sort,
		config.sort ?? {},
		config.fallbackSort,
		config.tiebreak
	)

	if (request.scope === 'page') {
		const { pageSize, offset } = paginate(request.query, config.maxPageSize)
		const sql =
			`SELECT ${select.join(', ')} FROM ${config.table} ${where} ` +
			`ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
		params.push(pageSize, offset)
		return { sql, params }
	}

	const sql =
		`SELECT ${select.join(', ')} FROM ${config.table} ${where} ` +
		`ORDER BY ${orderBy} LIMIT $${params.length + 1}`
	params.push(config.maxRows ?? 50_000)
	return { sql, params }
}
