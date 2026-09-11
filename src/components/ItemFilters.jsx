import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import {
  SORT_OPTIONS,
  DEFAULT_SORT,
  getDefaultFilters,
  applyFiltersToQuery,
  getSortOption,
  attachStanyLabels,
} from '../lib/itemFilters'
import { useFilterOptions } from './item-filters/useFilterOptions'
import FilterChips from './item-filters/FilterChips'

export const PAGE_SIZE = 20

const ItemFilters = forwardRef(function ItemFilters(
  {
    onResults,
    onLoading,
    onPaginationChange,
    onFilterStateChange,
    fixedType,
    mobilePanel = false,
    isOpen = true,
    onClose,
  },
  ref
) {
  const [nominal, setNominal] = useState('')
  const [kraj, setKraj] = useState('')
  const [rok, setRok] = useState('')
  const [miastoWydania, setMiastoWydania] = useState('')
  const [typ, setTyp] = useState(fixedType || 'wszystkie')
  const [stanZachowania, setStanZachowania] = useState('')
  const [mennica, setMennica] = useState('')
  const [material, setMaterial] = useState('')
  const [sortBy, setSortBy] = useState(DEFAULT_SORT)

  const [loading, setLoading] = useState(false)
  const [queryError, setQueryError] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const {
    stanyZachowania: stanyZachowaniList,
    mennicaOptions,
    materialOptions,
    error: optionsError,
  } = useFilterOptions()

  const error = queryError || optionsError

  const filtersStateRef = useRef(getDefaultFilters(fixedType))

  const requestInProgressRef = useRef(false)

  useEffect(() => {
    filtersStateRef.current = {
      nominal,
      kraj,
      rok,
      miastoWydania,
      typ: fixedType || typ,
      stanZachowania,
      mennica,
      material,
      sortBy,
    }

    onFilterStateChange?.(filtersStateRef.current)
  }, [
    fixedType,
    nominal,
    kraj,
    rok,
    miastoWydania,
    typ,
    stanZachowania,
    mennica,
    material,
    sortBy,
    onFilterStateChange,
  ])

  const handleFilter = useCallback(
    async ({ page = 0, append = false, sortOverride, filtersOverride } = {}) => {
      if (requestInProgressRef.current) return

      requestInProgressRef.current = true

      try {
        setLoading(true)
        setQueryError(null)
        onLoading?.(true)

        const filters = filtersOverride || {
          ...filtersStateRef.current,
          sortBy: sortOverride || filtersStateRef.current.sortBy,
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

        const withLabels = attachStanyLabels(data || [], stanyZachowaniList)

        const total = count || 0
        const loaded = start + withLabels.length
        const nextHasMore = loaded < total

        setCurrentPage(page)
        setHasMore(nextHasMore)

        onResults?.(withLabels, { append })

        onPaginationChange?.({
          total,
          loaded,
          page,
          hasMore: nextHasMore,
        })
      } catch (err) {
        console.error('Błąd filtrowania:', err)
        setQueryError('Nie udało się wczytać wyników.')
        setCurrentPage(0)
        setHasMore(false)

        onResults?.(null, { append: false })

        onPaginationChange?.({
          total: 0,
          loaded: 0,
          page: 0,
          hasMore: false,
        })
      } finally {
        requestInProgressRef.current = false
        setLoading(false)
        onLoading?.(false)
      }
    },
    [onLoading, onPaginationChange, onResults, stanyZachowaniList]
  )

  useEffect(() => {
    const initialFilters = getDefaultFilters(fixedType)

    setNominal('')
    setKraj('')
    setRok('')
    setMiastoWydania('')
    setTyp(initialFilters.typ)
    setStanZachowania('')
    setMennica('')
    setMaterial('')
    setSortBy(DEFAULT_SORT)
    setCurrentPage(0)
    setHasMore(false)

    filtersStateRef.current = initialFilters
    onFilterStateChange?.(initialFilters)

    handleFilter({
      page: 0,
      append: false,
      filtersOverride: initialFilters,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedType])

  const loadMore = useCallback(() => {
    if (loading || requestInProgressRef.current || !hasMore) return

    handleFilter({
      page: currentPage + 1,
      append: true,
    })
  }, [currentPage, handleFilter, hasMore, loading])

  useImperativeHandle(
    ref,
    () => ({
      loadMore,
    }),
    [loadMore]
  )

  const handleSortChange = (event) => {
    const nextSort = event.target.value

    setSortBy(nextSort)

    filtersStateRef.current = {
      ...filtersStateRef.current,
      sortBy: nextSort,
    }

    handleFilter({
      page: 0,
      append: false,
      sortOverride: nextSort,
    })

    if (mobilePanel && onClose) {
      onClose()
    }
  }

  const handleApply = () => {
    handleFilter({
      page: 0,
      append: false,
    })

    if (mobilePanel && onClose) {
      onClose()
    }
  }

  const handleClear = () => {
    const clearedFilters = getDefaultFilters(fixedType)

    setNominal('')
    setKraj('')
    setRok('')
    setMiastoWydania('')
    setTyp(clearedFilters.typ)
    setStanZachowania('')
    setMennica('')
    setMaterial('')
    setSortBy(DEFAULT_SORT)
    setQueryError(null)

    filtersStateRef.current = clearedFilters

    handleFilter({
      page: 0,
      append: false,
      filtersOverride: clearedFilters,
    })
  }

  if (mobilePanel && !isOpen) return null

  // Chipsy aktywnych filtrów (bez sortowania i typu narzuconego zakładką).
  const activeChips = [
    nominal.trim() && {
      key: 'nominal',
      label: `Nominał: ${nominal.trim()}`,
      onClear: () => setNominal(''),
    },
    kraj.trim() && {
      key: 'kraj',
      label: `Kraj: ${kraj.trim()}`,
      onClear: () => setKraj(''),
    },
    rok.trim() && {
      key: 'rok',
      label: `Rok: ${rok.trim()}`,
      onClear: () => setRok(''),
    },
    miastoWydania.trim() && {
      key: 'miasto',
      label: `Miasto: ${miastoWydania.trim()}`,
      onClear: () => setMiastoWydania(''),
    },
    stanZachowania && {
      key: 'stan',
      label: `Stan: ${
        stanyZachowaniList.find((s) => s.kod === stanZachowania)?.etykieta ||
        stanZachowania
      }`,
      onClear: () => setStanZachowania(''),
    },
    mennica && {
      key: 'mennica',
      label: `Mennica: ${mennica}`,
      onClear: () => setMennica(''),
    },
    material && {
      key: 'material',
      label: `Materiał: ${material}`,
      onClear: () => setMaterial(''),
    },
  ].filter(Boolean)

  return (
    <div
      className={`w-full rounded-lg border border-gray-200 bg-white p-4 ${
        mobilePanel ? 'shadow-lg' : 'lg:p-6'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {mobilePanel ? 'Filtry i sortowanie' : 'Filtry'}
        </h3>

        {mobilePanel && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Zamknij filtry"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FilterChips chips={activeChips} onClearAll={handleClear} />

      <div className="space-y-4">
        <div>
          <label
            htmlFor="sort-by"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Sortuj według
          </label>

          <select
            id="sort-by"
            value={sortBy}
            onChange={handleSortChange}
            className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-nominal"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Nominał
          </label>

          <input
            id="filter-nominal"
            type="text"
            value={nominal}
            onChange={(event) => setNominal(event.target.value)}
            placeholder="np. 100 zł"
            className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>

        <div>
          <label
            htmlFor="filter-kraj"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Kraj
          </label>

          <input
            id="filter-kraj"
            type="text"
            value={kraj}
            onChange={(event) => setKraj(event.target.value)}
            placeholder="np. Polska"
            className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>
      </div>

      {!mobilePanel && (
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 lg:hidden"
        >
          {isExpanded ? '▼ Schowaj pozostałe' : '▶ Rozwiń pozostałe filtry'}
        </button>
      )}

      <div
        className={`mt-4 space-y-4 ${
          mobilePanel || isExpanded ? 'block' : 'hidden'
        } lg:block`}
      >
        <div>
          <label
            htmlFor="filter-rok"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Rok
          </label>

          <input
            id="filter-rok"
            type="number"
            value={rok}
            onChange={(event) => setRok(event.target.value)}
            placeholder="np. 2023"
            className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>

        <div>
          <label
            htmlFor="filter-miasto"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Miasto wydania
          </label>

          <input
            id="filter-miasto"
            type="text"
            value={miastoWydania}
            onChange={(event) => setMiastoWydania(event.target.value)}
            placeholder="np. Warszawa"
            className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>

        {!fixedType && (
          <div>
            <label
              htmlFor="filter-typ"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Typ
            </label>

            <select
              id="filter-typ"
              value={typ}
              onChange={(event) => setTyp(event.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              <option value="wszystkie">-- Wszystkie --</option>
              <option value="moneta">Moneta</option>
              <option value="banknot">Banknot</option>
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="filter-stan"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Stan zachowania
          </label>

          <select
            id="filter-stan"
            value={stanZachowania}
            onChange={(event) => setStanZachowania(event.target.value)}
            className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          >
            <option value="">-- Wszystkie --</option>

            {stanyZachowaniList.map((stan) => (
              <option key={stan.kod} value={stan.kod}>
                {stan.etykieta}
              </option>
            ))}
          </select>
        </div>

        {mennicaOptions.length > 0 && (
          <div>
            <label
              htmlFor="filter-mennica"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Mennica
            </label>

            <select
              id="filter-mennica"
              value={mennica}
              onChange={(event) => setMennica(event.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              <option value="">-- Wszystkie --</option>

              {mennicaOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {materialOptions.length > 0 && (
          <div>
            <label
              htmlFor="filter-material"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Materiał / stop
            </label>

            <select
              id="filter-material"
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
              className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              <option value="">-- Wszystkie --</option>

              {materialOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading ? 'Filtrowanie...' : 'Zastosuj'}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="flex-1 rounded-lg bg-gray-200 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
        >
          Wyczyść
        </button>
      </div>
    </div>
  )
})

export default ItemFilters
