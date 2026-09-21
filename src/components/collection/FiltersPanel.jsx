import { useState } from 'react'
import { SORT_OPTIONS } from '../../lib/itemFilters'
import { useFilterOptions } from '../item-filters/useFilterOptions'
import FilterChips from '../item-filters/FilterChips'
import { useCollectionContext } from '../../collection/collectionContext'

/**
 * Prezentacyjny panel filtrów i sortowania.
 *
 * Cały stan i logika zapytania mieszkają w `useCollection` (kontekst).
 * Ten komponent tylko renderuje pola i woła akcje z kontekstu - dzięki temu
 * ten sam panel działa bez zmian w desktopowym sidebarze, w akordeonie i w
 * mobilnym modalu (wszystkie czytają jeden wspólny stan).
 *
 * Props:
 *  - embedded: tryb osadzony (akordeon w sidebarze) - bez własnej karty/nagłówka
 *              i bez duplikatu przycisku "Wyczyść" (robi to nagłówek akordeonu),
 *  - hideHeader: ukrywa TYLKO wewnętrzny nagłówek (modal ma własny tytuł),
 *  - onClose: obecność przełącza tryb modalny (✕ + zamykanie po Zastosuj/sort).
 */
export default function FiltersPanel({
  embedded = false,
  hideHeader = false,
  onClose,
}) {
  const {
    draft,
    setField,
    setSortBy,
    apply,
    clear,
    loading,
    error,
    fixedType,
  } = useCollectionContext()

  const isModal = Boolean(onClose)
  const [isExpanded, setIsExpanded] = useState(false)

  const { mennicaOptions, materialOptions } = useFilterOptions()

  // Chipsy aktywnych filtrów (bez sortowania i typu narzuconego zakładką).
  // Czyszczenie chipa zmienia draft, ale NIE odpytuje od razu (dopiero "Zastosuj").
  const activeChips = [
    draft.search.trim() && {
      key: 'search',
      label: `Szukaj: ${draft.search.trim()}`,
      onClear: () => setField('search', ''),
    },
    draft.nominal.trim() && {
      key: 'nominal',
      label: `Nominał: ${draft.nominal.trim()}`,
      onClear: () => setField('nominal', ''),
    },
    draft.kraj.trim() && {
      key: 'kraj',
      label: `Emitent: ${draft.kraj.trim()}`,
      onClear: () => setField('kraj', ''),
    },
    draft.dataOd.trim() && {
      key: 'dataOd',
      label: `Data od: ${draft.dataOd}`,
      onClear: () => setField('dataOd', ''),
    },
    draft.dataDo.trim() && {
      key: 'dataDo',
      label: `Data do: ${draft.dataDo}`,
      onClear: () => setField('dataDo', ''),
    },
    draft.znakWodny.trim() && {
      key: 'znakWodny',
      label: `Znak wodny: ${draft.znakWodny.trim()}`,
      onClear: () => setField('znakWodny', ''),
    },
    draft.mennica && {
      key: 'mennica',
      label: `Mennica: ${draft.mennica}`,
      onClear: () => setField('mennica', ''),
    },
    draft.material && {
      key: 'material',
      label: `Materiał: ${draft.material}`,
      onClear: () => setField('material', ''),
    },
  ].filter(Boolean)

  const handleSortChange = (event) => {
    setSortBy(event.target.value)
    if (isModal) onClose()
  }

  const handleApply = () => {
    apply()
    if (isModal) onClose()
  }

  const fieldClass =
    'min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300'
  const fieldClassPlaceholder = `${fieldClass} placeholder:text-gray-500`

  return (
    <div
      className={
        embedded || isModal
          ? 'w-full'
          : 'w-full rounded-lg border border-gray-200 bg-white p-4 lg:p-6'
      }
    >
      {!embedded && !hideHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {isModal ? 'Filtry i sortowanie' : 'Filtry'}
          </h3>

          {isModal && (
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
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FilterChips
        chips={activeChips}
        onClearAll={embedded ? undefined : clear}
      />

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
            value={draft.sortBy}
            onChange={handleSortChange}
            className={fieldClass}
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
            htmlFor="filter-search"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Szukaj
          </label>

          <input
            id="filter-search"
            type="search"
            value={draft.search}
            onChange={(event) => setField('search', event.target.value)}
            placeholder="np. 100 zł, Anglica, Londyn…"
            className={fieldClassPlaceholder}
          />

          <p className="mt-1 text-xs text-gray-500">
            Przeszukuje kraj, nominał, mennicę, materiał, uwagi i pozostałe pola
            tekstowe.
          </p>
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
            value={draft.nominal}
            onChange={(event) => setField('nominal', event.target.value)}
            placeholder="np. 100 zł"
            className={fieldClassPlaceholder}
          />
        </div>

        <div>
          <label
            htmlFor="filter-kraj"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Emitent
          </label>

          <input
            id="filter-kraj"
            type="text"
            value={draft.kraj}
            onChange={(event) => setField('kraj', event.target.value)}
            placeholder="np. Polska"
            className={fieldClassPlaceholder}
          />
        </div>
      </div>

      {!isModal && (
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
          isModal || isExpanded ? 'block' : 'hidden'
        } lg:block`}
      >
        {/* Data emisji od-do: pionowo, żeby zmieściło się na wąskim sidebarze. */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="filter-data-od"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Data emisji od
            </label>

            <input
              id="filter-data-od"
              type="date"
              value={draft.dataOd}
              onChange={(event) => setField('dataOd', event.target.value)}
              className={`block min-w-0 ${fieldClass}`}
            />
          </div>

          <div>
            <label
              htmlFor="filter-data-do"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Data emisji do
            </label>

            <input
              id="filter-data-do"
              type="date"
              value={draft.dataDo}
              onChange={(event) => setField('dataDo', event.target.value)}
              className={`block min-w-0 ${fieldClass}`}
            />
          </div>
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
              value={draft.typ}
              onChange={(event) => setField('typ', event.target.value)}
              className={fieldClass}
            >
              <option value="wszystkie">-- Wszystkie --</option>
              <option value="moneta">Moneta</option>
              <option value="banknot">Banknot</option>
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="filter-znak-wodny"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Znak wodny
          </label>

          <input
            id="filter-znak-wodny"
            type="text"
            value={draft.znakWodny}
            onChange={(event) => setField('znakWodny', event.target.value)}
            placeholder="np. sześciokątna gwiazda"
            className={fieldClassPlaceholder}
          />
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
              value={draft.mennica}
              onChange={(event) => setField('mennica', event.target.value)}
              className={fieldClass}
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
              value={draft.material}
              onChange={(event) => setField('material', event.target.value)}
              className={fieldClass}
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

        {!embedded && (
          <button
            type="button"
            onClick={clear}
            disabled={loading}
            className="flex-1 rounded-lg bg-gray-200 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            Wyczyść
          </button>
        )}
      </div>
    </div>
  )
}
