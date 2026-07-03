import { describe, expect, it } from 'vitest'

import { noteListMount, resolveListId } from './useListData'

describe('resolveListId', () => {
	it('returns the bare id when no scope is given', () => {
		expect(resolveListId('admin-planeaciones')).toBe('admin-planeaciones')
	})

	it('suffixes the scope with the `::` cache boundary', () => {
		expect(resolveListId('admin-planeaciones', 'student-42')).toBe(
			'admin-planeaciones::student-42'
		)
	})

	it('treats an empty-string scope as no scope', () => {
		// A falsy scope (e.g. `cacheScope={studentId}` before the id loads) must
		// not create a distinct `id::` bucket that never gets reused.
		expect(resolveListId('users', '')).toBe('users')
	})

	it('keeps distinct scopes in distinct namespaces', () => {
		// The whole point: two views of one config must not collide.
		expect(resolveListId('plans', 'a')).not.toBe(resolveListId('plans', 'b'))
	})

	it('shares the id prefix so invalidateListCache(id) still clears every scope', () => {
		// invalidateListCache matches on the `${id}::` prefix, so both scoped
		// namespaces must start with it.
		expect(resolveListId('plans', 'a').startsWith('plans::')).toBe(true)
		expect(resolveListId('plans', 'b').startsWith('plans::')).toBe(true)
	})
})

describe('noteListMount', () => {
	it('does not warn the first time an id is mounted', () => {
		const registry = new Map<string, Set<string>>()
		expect(noteListMount(registry, 'users', '/admin/users')).toBeNull()
	})

	it('does not warn when the same id remounts on the same route', () => {
		const registry = new Map<string, Set<string>>()
		noteListMount(registry, 'users', '/admin/users')
		// StrictMode double-mount / navigation back to the same page.
		expect(noteListMount(registry, 'users', '/admin/users')).toBeNull()
	})

	it('warns when one id is mounted on a second route', () => {
		const registry = new Map<string, Set<string>>()
		noteListMount(registry, 'admin-planeaciones', '/admin/planeaciones')
		const warning = noteListMount(
			registry,
			'admin-planeaciones',
			'/admin/estudiantes/42'
		)
		expect(warning).toContain('admin-planeaciones')
		expect(warning).toContain('multiple routes')
		expect(warning).toContain('cacheScope')
	})

	it('names both colliding routes in the warning', () => {
		const registry = new Map<string, Set<string>>()
		noteListMount(registry, 'plans', '/a')
		const warning = noteListMount(registry, 'plans', '/b')
		expect(warning).toContain('/a')
		expect(warning).toContain('/b')
	})

	it('does not warn for distinct scoped ids (the fix in action)', () => {
		const registry = new Map<string, Set<string>>()
		// Each student tab resolves to its own id via resolveListId.
		const a = resolveListId('admin-planeaciones', 'student-1')
		const b = resolveListId('admin-planeaciones', 'student-2')
		expect(noteListMount(registry, a, '/admin/estudiantes/1')).toBeNull()
		expect(noteListMount(registry, b, '/admin/estudiantes/2')).toBeNull()
	})

	it('warns once per new route, not on every remount', () => {
		const registry = new Map<string, Set<string>>()
		noteListMount(registry, 'plans', '/a')
		expect(noteListMount(registry, 'plans', '/b')).not.toBeNull() // first crossing
		expect(noteListMount(registry, 'plans', '/b')).toBeNull() // /b already seen
	})
})
