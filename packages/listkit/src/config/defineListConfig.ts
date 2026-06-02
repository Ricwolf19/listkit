import type { ListConfig } from '../types/config'

/**
 * Identity helper that ties a {@link ListConfig} to its row type `T`, so
 * `search`, `sort`, `card`, `table`, and `actions` all infer against the same
 * `T` without restating the generic at each callback.
 *
 * @typeParam T - The row type.
 * @param config - The list configuration.
 * @returns The same `config`, typed as `ListConfig<T>`.
 *
 * @remarks
 * Exported from both the main entry and `@pibytelabs/listkit/server`. Import it
 * from `/server` when the config is built in a React Server Component, so the
 * module graph doesn't pull the client context.
 *
 * @example
 * ```tsx
 * import { defineListConfig } from '@pibytelabs/listkit/server'
 *
 * export const usersConfig = defineListConfig<User>({
 *   id: 'users',
 *   search: true,
 *   table: { columns: [{ key: 'name', header: 'Name', sortable: true }] },
 * })
 * ```
 */
export function defineListConfig<T>(config: ListConfig<T>): ListConfig<T> {
	return config
}
