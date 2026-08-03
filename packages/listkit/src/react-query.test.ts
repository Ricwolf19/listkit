import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import {
	invalidateList,
	LISTKIT_QUERY_KEY,
	listQueryKey,
	matchesListId,
} from './react-query'
import type { ListQuery } from './types/data'

const QUERY: ListQuery = { page: 1, pageSize: 20 }

describe('listQueryKey', () => {
	it('places the adapter key after the list id', () => {
		expect(listQueryKey('users', QUERY, 0, 'https://api/users')).toEqual([
			LISTKIT_QUERY_KEY,
			'users',
			'https://api/users',
			QUERY,
			0,
		])
	})

	it('keeps a null slot when the adapter declares no key', () => {
		expect(listQueryKey('users', QUERY)[2]).toBeNull()
	})

	it('separates two sources under the same list id', () => {
		expect(listQueryKey('users', QUERY, 0, '/a')).not.toEqual(
			listQueryKey('users', QUERY, 0, '/b')
		)
	})
})

describe('matchesListId', () => {
	it('matches the plain id', () => {
		expect(matchesListId('users', 'users')).toBe(true)
	})

	it('matches a cacheScope-suffixed id', () => {
		expect(matchesListId('users::42', 'users')).toBe(true)
	})

	it('does not match a different list whose id shares a prefix', () => {
		expect(matchesListId('usersArchive', 'users')).toBe(false)
	})

	it('rejects a non-string segment', () => {
		expect(matchesListId(42, 'users')).toBe(false)
	})
})

describe('invalidateList', () => {
	const seed = (client: QueryClient, listId: string) => {
		client.setQueryData(listQueryKey(listId, QUERY, 0), { data: [], total: 0 })
	}
	const isStale = (client: QueryClient, listId: string) =>
		client.getQueryState(listQueryKey(listId, QUERY, 0))?.isInvalidated === true

	it('invalidates every scope of a list, and nothing else', async () => {
		const client = new QueryClient()
		seed(client, 'users')
		seed(client, 'users::42')
		seed(client, 'usersArchive')
		seed(client, 'orders')

		await invalidateList(client, 'users')

		expect(isStale(client, 'users')).toBe(true)
		expect(isStale(client, 'users::42')).toBe(true)
		expect(isStale(client, 'usersArchive')).toBe(false)
		expect(isStale(client, 'orders')).toBe(false)
	})

	it('invalidates every list when no id is given', async () => {
		const client = new QueryClient()
		seed(client, 'users')
		seed(client, 'orders')

		await invalidateList(client)

		expect(isStale(client, 'users')).toBe(true)
		expect(isStale(client, 'orders')).toBe(true)
	})
})
