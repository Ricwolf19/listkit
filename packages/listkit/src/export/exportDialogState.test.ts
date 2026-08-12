import { describe, expect, it } from 'vitest'

import type { ExportField } from '../types/export'
import {
	groupCounts,
	initExportDialog,
	moveField,
	reorderSelected,
	selectedInOrder,
	setFieldsSelected,
	setFilter,
	toggleField,
	visibleFields,
} from './exportDialogState'

const FIELDS: ExportField[] = [
	{ key: 'name', label: 'Nombre', group: 'general' },
	{ key: 'status', label: 'Estado', group: 'general' },
	{ key: 'taxId', label: 'RFC', group: 'fiscal', defaultSelected: false },
	{ key: 'createdAt', label: 'Creación', group: 'fiscal' },
]

describe('initExportDialog', () => {
	it('pre-checks defaultSelected fields', () => {
		const s = initExportDialog(FIELDS)
		expect(selectedInOrder(s)).toEqual(['name', 'status', 'createdAt'])
	})

	it('live visible columns override defaultSelected', () => {
		const s = initExportDialog(FIELDS, { visibleKeys: new Set(['taxId']) })
		expect(selectedInOrder(s)).toEqual(['taxId'])
	})
})

describe('selection', () => {
	it('toggles and batch-sets without touching order', () => {
		let s = initExportDialog(FIELDS)
		s = toggleField(s, 'status')
		expect(selectedInOrder(s)).toEqual(['name', 'createdAt'])
		s = setFieldsSelected(s, ['name', 'status', 'taxId', 'createdAt'], true)
		expect(selectedInOrder(s)).toEqual(['name', 'status', 'taxId', 'createdAt'])
		s = setFieldsSelected(s, ['name', 'status'], false)
		expect(selectedInOrder(s)).toEqual(['taxId', 'createdAt'])
	})

	it('counts per group for the (n/m) badge', () => {
		const s = initExportDialog(FIELDS)
		const counts = groupCounts(s, FIELDS)
		expect(counts.get('general')).toEqual({ selected: 2, total: 2 })
		expect(counts.get('fiscal')).toEqual({ selected: 1, total: 2 })
	})
})

describe('moveField', () => {
	it('reorders among selected keys, skipping unchecked ones', () => {
		let s = initExportDialog(FIELDS) // selected: name, status, createdAt (taxId off)
		s = moveField(s, 'createdAt', -1)
		// createdAt hops over the unchecked taxId, landing before status.
		expect(selectedInOrder(s)).toEqual(['name', 'createdAt', 'status'])
	})

	it('is a no-op at the edges', () => {
		const s = initExportDialog(FIELDS)
		expect(selectedInOrder(moveField(s, 'name', -1))).toEqual(
			selectedInOrder(s)
		)
	})

	it('the reordered result is exactly ExportRequest.fields', () => {
		let s = initExportDialog(FIELDS)
		s = moveField(s, 'status', -1)
		expect(selectedInOrder(s)).toEqual(['status', 'name', 'createdAt'])
	})
})

describe('reorderSelected', () => {
	// Indices are into the SELECTED list, which is what the dialog renders.
	it('drops a field at another selected position', () => {
		let s = initExportDialog(FIELDS) // selected: name, status, createdAt
		s = reorderSelected(s, 2, 0)
		expect(selectedInOrder(s)).toEqual(['createdAt', 'name', 'status'])
	})

	it('moving down lands after the target', () => {
		let s = initExportDialog(FIELDS)
		s = reorderSelected(s, 0, 2)
		expect(selectedInOrder(s)).toEqual(['status', 'createdAt', 'name'])
	})

	it('ignores unchecked fields sitting between the two rows', () => {
		// taxId is unchecked and sits between status and createdAt in `order`.
		let s = initExportDialog(FIELDS)
		s = reorderSelected(s, 1, 2)
		expect(selectedInOrder(s)).toEqual(['name', 'createdAt', 'status'])
	})

	it('is a no-op onto itself or out of range', () => {
		const s = initExportDialog(FIELDS)
		expect(reorderSelected(s, 1, 1)).toBe(s)
		expect(reorderSelected(s, 0, 9)).toBe(s)
	})
})

describe('visibleFields', () => {
	it('filters by folded label without losing selection', () => {
		let s = initExportDialog(FIELDS)
		s = setFilter(s, 'creacion') // accent-folded match for "Creación"
		const visible = visibleFields(s, FIELDS)
		expect(visible.map(f => f.key)).toEqual(['createdAt'])
		// Hidden rows stay checked.
		expect(selectedInOrder(s)).toContain('name')
	})

	it('lists fields in the arranged order', () => {
		let s = initExportDialog(FIELDS)
		s = moveField(s, 'status', -1)
		expect(visibleFields(s, FIELDS).map(f => f.key)).toEqual([
			'status',
			'name',
			'taxId',
			'createdAt',
		])
	})
})
