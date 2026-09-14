import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import ItemFilters from './components/ItemFilters'
import FilterModal from './components/FilterModal'
import ItemsList from './components/ItemsList'
import AuthGate from './components/AuthGate'
import LoadingFallback from './components/LoadingFallback'
import { exportItemsToCsv } from './components/items-list/exportCsv'
import { fetchAllItemsForExport } from './lib/itemsApi'
import { supabase } from './lib/supabase'

// Formularze ładowane leniwie - nie są potrzebne przy pierwszym renderze
// listy, a ich kod jest spory (pola, zdjęcia, walidacja).
const ItemForm = lazy(() => import('./components/ItemForm'))
const QuickAddForm = lazy(() => import('./components/QuickAddForm'))

const VIEW_STORAGE_KEY = 'kolekcja_widok_typ'
const LAYOUT_STORAGE_KEY = 'kolekcja_widok_layout'
const SIDEBAR_STORAGE_KEY = 'kolekcja_sidebar_zwiniety'

function getInitialView() {
  if (typeof window === 'undefined') return 'moneta'

  const saved = window.localStorage.getItem(VIEW_STORAGE_KEY)

  return saved === 'moneta' || saved === 'banknot' ? saved : 'moneta'
}

function getInitialLayout() {
  if (typeof window === 'undefined') return 'lista'

  const saved = window.localStorage.getItem(LAYOUT_STORAGE_KEY)

  return saved === 'galeria' ? 'galeria' : 'lista'
}

function getInitialSidebarCollapsed() {
  if (typeof window === 'undefined') return false

  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
}

function App() {
  const [view, setView] = useState(getInitialView)
  const [mode, setMode] = useState('lista')
  const [layout, setLayout] = useState(getInitialLayout) // 'lista' | 'galeria'
  // Tryb dodawania: 'szybki' (formularz ze zdjęciem) lub 'pelny' (wszystkie pola)
  const [addMode, setAddMode] = useState('szybki')
  const [filterResults, setFilterResults] = useState(null)
  // Bieżące filtry z ItemFilters - używane do eksportu CAŁEGO zbioru (nie tylko wczytanych stron).
  const [currentFilters, setCurrentFilters] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [isDetailView, setIsDetailView] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    getInitialSidebarCollapsed
  )

  const [pagination, setPagination] = useState({
    total: 0,
    loaded: 0,
    page: 0,
    hasMore: false,
  })

  /*
   * Ten filtr jest głównym kontrolerem zapytań i paginacji.
   * <aside> bywa ukryty przez Tailwind, ale komponent nadal jest
   * zamontowany, więc jego ref oraz loadMore() są zawsze dostępne.
   */
  const desktopFiltersRef = useRef(null)

  const handleResults = useCallback(
    (newItems, { append = false } = {}) => {
      if (newItems === null) {
        setFilterResults(null)
        return
      }

      setFilterResults((previousItems) => {
        if (!append) {
          return newItems
        }

        const uniqueItems = new Map()

        for (const item of [...(previousItems || []), ...newItems]) {
          uniqueItems.set(item.id, item)
        }

        return Array.from(uniqueItems.values())
      })
    },
    []
  )

  const handlePaginationChange = useCallback((nextPagination) => {
    setPagination(nextPagination)
  }, [])

  const closeMobileFilters = useCallback(() => {
    setIsMobileFiltersOpen(false)
  }, [])

  // ItemFilters zgłasza aktualny zestaw filtrów - potrzebny do eksportu całości.
  const handleFilterStateChange = useCallback((nextFilters) => {
    setCurrentFilters(nextFilters)
  }, [])

  // Eksport CSV: pobiera CAŁY zbiór spełniający bieżące filtry (nie tylko
  // wczytane strony listy) i pobiera plik.
  const handleExportAll = useCallback(async () => {
    if (!currentFilters || isExporting) return

    try {
      setIsExporting(true)
      setExportError(null)

      const allItems = await fetchAllItemsForExport(currentFilters)

      if (allItems.length === 0) {
        setExportError('Brak pozycji do eksportu dla bieżących filtrów.')
        return
      }

      exportItemsToCsv(allItems, { scope: 'filtr' })
    } catch (err) {
      console.error('Błąd eksportu CSV:', err)
      setExportError('Nie udało się wyeksportować kolekcji.')
    } finally {
      setIsExporting(false)
    }
  }, [currentFilters, isExporting])

  const switchType = (nextType) => {
    setView(nextType)
    window.localStorage.setItem(VIEW_STORAGE_KEY, nextType)
    setMode('lista')
    setFilterResults(null)
    setIsDetailView(false)
    setIsMobileFiltersOpen(false)

    setPagination({
      total: 0,
      loaded: 0,
      page: 0,
      hasMore: false,
    })
  }

  const goToAdd = (nextAddMode = 'szybki') => {
    setAddMode(nextAddMode)
    setMode('dodaj')
    setIsDetailView(false)
  }

  const backToListAfterSave = () => {
    setMode('lista')
    setIsDetailView(false)
  }

  const changeLayout = (nextLayout) => {
    setLayout(nextLayout)
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, nextLayout)
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed((collapsed) => {
      const next = !collapsed
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

 const loadMore = () => {
  desktopFiltersRef.current?.loadMore()
}

  const typLabel = view === 'moneta' ? 'monetę' : 'banknot'
  const showFilters = mode === 'lista' && !isDetailView
  const canExport = Array.isArray(filterResults) && filterResults.length > 0

  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col lg:flex-row lg:bg-gray-50">
        {/* Górna nawigacja mobilna */}
        <div className="sticky top-0 z-10 flex border-b bg-white shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => switchType('moneta')}
            className={`flex-1 py-3 font-medium transition-colors ${
              view === 'moneta'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monety
          </button>

          <button
            type="button"
            onClick={() => switchType('banknot')}
            className={`flex-1 py-3 font-medium transition-colors ${
              view === 'banknot'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Banknoty
          </button>
        </div>

        {/* Sidebar. Ukrycie Tailwindem nie odmontowuje ItemFilters.
            Zwijanie (desktop) też nie odmontowuje - <aside> zostaje w DOM,
            zwężamy go i chowamy zawartość, więc filtry/paginacja dalej działają. */}
        <aside
          className={`hidden lg:flex lg:flex-col lg:border-r lg:bg-white lg:shadow-sm lg:transition-[width] lg:duration-200 ${
            isSidebarCollapsed ? 'lg:w-0 lg:overflow-hidden lg:border-r-0' : 'lg:w-80'
          }`}
        >
          <div className="flex items-center justify-between px-4 pt-4">
            <span className="text-sm font-semibold text-gray-500">Menu</span>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? 'Rozwiń panel' : 'Zwiń panel'}
              title={isSidebarCollapsed ? 'Rozwiń panel' : 'Zwiń panel'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              ◀
            </button>
          </div>

          <nav className="space-y-1 p-4 pt-2">
            <button
              type="button"
              onClick={() => switchType('moneta')}
              className={`w-full rounded-lg px-4 py-3 text-left font-medium transition-colors ${
                view === 'moneta'
                  ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Monety
            </button>

            <button
              type="button"
              onClick={() => switchType('banknot')}
              className={`w-full rounded-lg px-4 py-3 text-left font-medium transition-colors ${
                view === 'banknot'
                  ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Banknoty
            </button>
          </nav>

          {/* Filtry trzymamy ZAWSZE zamontowane (chowamy CSS-em), żeby ich stan
              nie znikał przy wejściu/wyjściu z detalu. */}
          <div
            className={`flex-1 overflow-y-auto px-4 pb-4 ${
              showFilters ? '' : 'hidden'
            }`}
          >
            <ItemFilters
              ref={desktopFiltersRef}
              fixedType={view}
              onResults={handleResults}
              onPaginationChange={handlePaginationChange}
              onFilterStateChange={handleFilterStateChange}
            />
          </div>

          {showFilters && canExport && (
            <div className="space-y-1 px-4 pb-2">
              <button
                type="button"
                onClick={handleExportAll}
                disabled={isExporting || !currentFilters}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                {isExporting
                  ? 'Eksportowanie…'
                  : `⬇ Eksport CSV (wszystkie ${pagination.total})`}
              </button>

              {exportError && (
                <p className="text-xs text-red-600">{exportError}</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="mx-4 mb-4 mt-auto rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
          >
            Wyloguj
          </button>
        </aside>

        {/* Uchwyt do rozwijania zwiniętego sidebara (tylko desktop) */}
        {isSidebarCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Rozwiń panel"
            title="Rozwiń panel"
            className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 rounded-r-lg border border-l-0 border-gray-300 bg-white px-1.5 py-6 text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700 lg:block"
          >
            ▶
          </button>
        )}

        <main className="flex-1 lg:overflow-auto">
          {mode === 'lista' ? (
            <div className="space-y-4 p-4 lg:p-6">
              {/* Filtr + sortowanie na mobile: jeden przycisk otwierający modal */}
              {showFilters && (
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    ☰ Filtry i sortowanie
                  </button>

                  <FilterModal
                    isOpen={isMobileFiltersOpen}
                    onClose={closeMobileFilters}
                  >
                    <ItemFilters
                      fixedType={view}
                      onResults={handleResults}
                      onPaginationChange={handlePaginationChange}
                      onFilterStateChange={handleFilterStateChange}
                      onClose={closeMobileFilters}
                    />
                  </FilterModal>
                </div>
              )}

              {showFilters && (
                <div className="mx-auto max-w-md lg:max-w-6xl">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => goToAdd('szybki')}
                      className="flex-1 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      📷 Szybko dodaj {typLabel}
                    </button>

                    <button
                      type="button"
                      onClick={() => goToAdd('pelny')}
                      className="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      + Pełny formularz
                    </button>
                  </div>
                </div>
              )}

              {showFilters && (
                <div className="mx-auto flex max-w-md items-center justify-between gap-3 lg:max-w-6xl">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {view === 'moneta' ? 'Monety' : 'Banknoty'}
                  </h2>

                  <div
                    role="group"
                    aria-label="Sposób wyświetlania"
                    className="inline-flex rounded-lg border border-gray-200 bg-white p-1"
                  >
                    <button
                      type="button"
                      onClick={() => changeLayout('lista')}
                      aria-pressed={layout === 'lista'}
                      className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                        layout === 'lista'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Lista
                    </button>

                    <button
                      type="button"
                      onClick={() => changeLayout('galeria')}
                      aria-pressed={layout === 'galeria'}
                      className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                        layout === 'galeria'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Galeria
                    </button>
                  </div>
                </div>
              )}

              <ItemsList
                filteredItems={filterResults}
                onModeChange={setIsDetailView}
                pagination={pagination}
                onLoadMore={loadMore}
                viewMode={layout}
              />
            </div>
          ) : addMode === 'szybki' ? (
            <Suspense fallback={<LoadingFallback label="Wczytywanie formularza…" />}>
              <QuickAddForm
                fixedType={view}
                onSaved={backToListAfterSave}
                onCancel={backToListAfterSave}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<LoadingFallback label="Wczytywanie formularza…" />}>
              <ItemForm
                fixedType={view}
                onSaved={backToListAfterSave}
                onCancel={backToListAfterSave}
              />
            </Suspense>
          )}
        </main>
      </div>
    </AuthGate>
  )
}

export default App