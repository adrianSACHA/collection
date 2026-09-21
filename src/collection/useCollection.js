import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  DEFAULT_SORT,
  getDefaultFilters,
  applyFiltersToQuery,
  getSortOption,
} from '../lib/itemFilters'

// Rozmiar strony listy (bez zmian względem poprzedniego ItemFilters).
export const PAGE_SIZE = 20

function emptyPagination() {
  return { total: 0, loaded: 0, page: 0, hasMore: false }
}

// Liczba aktywnych filtrów (bez sortowania i typu narzuconego zakładką) -
// spójna z chipsami i badge'em akordeonu.
function countActiveFilters(draft) {
  return [
    draft.search,
    draft.nominal,
    draft.kraj,
    draft.dataOd,
    draft.dataDo,
    draft.znakWodny,
    draft.mennica,
    draft.material,
  ].filter((value) => value && String(value).trim() !== '').length
}

/**
 * Jedyne źródło prawdy dla: stanu filtrów (draft), wykonania zapytania,
 * wyników listy i paginacji. Zastępuje logikę wbudowaną w ItemFilters.
 *
 * - `draft` to bieżące wartości pól; zmiana pola NIE odpytuje.
 * - `apply()` / `setSortBy()` / `clear()` odpytać potrafią (zgodnie z dawnym UI).
 * - `syncType(nextType)` resetuje filtry i przeładowuje listę - wołane z App
 *   przy przełączeniu zakładki (event handler, bez efektu).
 */
export function useCollection({ fixedType } = {}) {
  const [draft, setDraft] = useState(() => getDefaultFilters(fixedType))
  const [items, setItems] = useState(null)
  const [pagination, setPagination] = useState(emptyPagination)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const requestInProgressRef = useRef(false)
  // Ref trzymany synchronicznie, żeby `apply()` widział najświeższy draft
  // bez czekania na re-render.
  const draftRef = useRef(draft)

  const run = useCallback(
    async ({ page = 0, append = false, filtersOverride } = {}) => {
      if (requestInProgressRef.current) return

      requestInProgressRef.current = true

      try {
        setLoading(true)
        setError(null)

        const base = draftRef.current
        const filters = filtersOverride || {
          ...base,
          typ: fixedType || base.typ,
        }

        const activeSort = getSortOption(filters.sortBy)
        const start = page * PAGE_SIZE
        const end = start + PAGE_SIZE - 1

        let query = supabase
          .from('items')
          .select('*', { count: 'exact' })
          .order(activeSort.column, {
            ascending: activeSort.ascending,
            nullsFirst: false,
          })
          .range(start, end)

        query = applyFiltersToQuery(query, filters)

        const { data, error: err, count } = await query

        if (err) throw err

        const rows = data || []
        const total = count || 0
        const loaded = start + rows.length
        const hasMore = loaded < total

        setItems((previous) => {
          if (!append) return rows

          const map = new Map()

          for (const item of [...(previous || []), ...rows]) {
            map.set(item.id, item)
          }

          return Array.from(map.values())
        })

        setPagination({ total, loaded, page, hasMore })
      } catch (err) {
        console.error('Błąd filtrowania:', err)
        setError('Nie udało się wczytać wyników.')
        setItems(null)
        setPagination(emptyPagination())
      } finally {
        requestInProgressRef.current = false
        setLoading(false)
      }
    },
    [fixedType]
  )

  // Pierwsze wczytanie po zamontowaniu (CollectionApp montuje się po zalogowaniu).
  // Świadomy wyjątek od reguły set-state-in-effect: to jednorazowy fetch danych
  // z zewnętrznego źródła (Supabase) przy montowaniu ("fetch on mount").
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run({ page: 0, append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setField = useCallback((name, value) => {
    draftRef.current = { ...draftRef.current, [name]: value }
    setDraft(draftRef.current)
  }, [])

  const apply = useCallback(() => {
    run({ page: 0, append: false })
  }, [run])

  const clear = useCallback(() => {
    const cleared = getDefaultFilters(fixedType)

    draftRef.current = cleared
    setDraft(cleared)
    setError(null)

    run({ page: 0, append: false, filtersOverride: cleared })
  }, [fixedType, run])

  const setSortBy = useCallback(
    (value) => {
      draftRef.current = { ...draftRef.current, sortBy: value }
      setDraft(draftRef.current)

      run({
        page: 0,
        append: false,
        filtersOverride: { ...draftRef.current, sortBy: value },
      })
    },
    [run]
  )

  // Reset + przeładowanie przy zmianie typu kolekcji.
  const syncType = useCallback(
    (nextType) => {
      const initial = getDefaultFilters(nextType)

      draftRef.current = initial
      setDraft(initial)
      setError(null)
      setPagination(emptyPagination())

      run({ page: 0, append: false, filtersOverride: initial })
    },
    [run]
  )

  const loadMore = useCallback(() => {
    if (loading || requestInProgressRef.current || !pagination.hasMore) return

    run({ page: pagination.page + 1, append: true })
  }, [loading, pagination.hasMore, pagination.page, run])

  const refresh = useCallback(() => {
    run({ page: 0, append: false })
  }, [run])

  const activeFilterCount = useMemo(() => countActiveFilters(draft), [draft])

  return {
    draft,
    setField,
    apply,
    clear,
    setSortBy,
    syncType,

    items,
    pagination,
    loading,
    error,

    loadMore,
    refresh,

    activeFilterCount,

    defaultSort: DEFAULT_SORT,
  }
}
