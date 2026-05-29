import { useCallback, useMemo, useState } from 'react'

import {
	decodeFilterValue,
	encodeFilterValue,
	filterParamKey,
	flattenFilters,
	isFilterValueActive,
} from '../filters/serialize'
import type { FilterSection } from '../types/filters'
import type { ListParams } from './useListParams'

/**
 * Draft state for the filter sidebar. Initializes from the applied (param-store)
 * values; edits stay local until `apply()` writes them back to the store.
 */
export function useFilters<T>(
	sections: FilterSection<T>[],
	params: ListParams
) {
	const defs = useMemo(() => flattenFilters(sections), [sections])

	const readDraft = useCallback(() => {
		const draft: Record<string, unknown> = {}
		for (const def of defs) {
			const value = decodeFilterValue(
				def.type,
				params.get(filterParamKey(def.id))
			)
			if (value != null) draft[def.id] = value
		}
		return draft
	}, [defs, params])

	const [draft, setDraft] = useState<Record<string, unknown>>(readDraft)

	const setValue = useCallback((id: string, value: unknown) => {
		setDraft(prev => ({ ...prev, [id]: value }))
	}, [])

	/** Re-sync the draft from the store (call when opening the sidebar). */
	const reset = useCallback(() => setDraft(readDraft()), [readDraft])

	const apply = useCallback(() => {
		const updates: Record<string, string | null> = {}
		for (const def of defs) {
			const value = draft[def.id]
			const active = value != null && isFilterValueActive(def.type, value)
			updates[filterParamKey(def.id)] = active ? encodeFilterValue(value) : null
		}
		updates.page = null
		params.setMany(updates)
	}, [defs, draft, params])

	const clear = useCallback(() => {
		const updates: Record<string, string | null> = {}
		for (const def of defs) updates[filterParamKey(def.id)] = null
		updates.page = null
		params.setMany(updates)
		setDraft({})
	}, [defs, params])

	return { draft, setValue, apply, reset, clear }
}
