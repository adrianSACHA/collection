import { useCallback, useRef, useState } from 'react'
import ItemForm from './components/ItemForm'
import ItemFilters from './components/ItemFilters'
import ItemsList from './components/ItemsList'
import AuthGate from './components/AuthGate'
import { supabase } from './lib/supabase'

const VIEW_STORAGE_KEY = 'kolekcja_widok_typ'

function getInitialView() {
  if (typeof window === 'undefined') return 'moneta'

  const saved = window.localStorage.getItem(VIEW_STORAGE_KEY)

  return saved === 'moneta' || saved === 'banknot' ? saved : 'moneta'
}

function App() {
  const [view, setView] = useState(getInitialView)
  const [mode, setMode] = useState('lista')
  const [filterResults, setFilterResults] = useState(null)
  const [isDetailView, setIsDetailView] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

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

  const goToAdd = () => {
    setMode('dodaj')
    setIsDetailView(false)
  }

  const backToListAfterSave = () => {
    setMode('lista')
    setIsDetailView(false)
  }

 const loadMore = () => {
  desktopFiltersRef.current?.loadMore()
}

  const typLabel = view === 'moneta' ? 'monetę' : 'banknot'
  const showFilters = mode === 'lista' && !isDetailView

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

        {/* Sidebar. Ukrycie Tailwindem nie odmontowuje ItemFilters. */}
        <aside className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:bg-white lg:shadow-sm">
          <nav className="space-y-1 p-4">
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

          {showFilters && (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <ItemFilters
                ref={desktopFiltersRef}
                fixedType={view}
                onResults={handleResults}
                onPaginationChange={handlePaginationChange}
              />
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

        <main className="flex-1 lg:overflow-auto">
          {mode === 'lista' ? (
            <div className="space-y-4 p-4 lg:p-6">
              {/* Przycisk i panel filtrów dostępne tylko na mobile */}
              {showFilters && (
                <div className="lg:hidden">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsMobileFiltersOpen(true)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      ☰ Filtry
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMobileFiltersOpen(true)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      ↕ Sortuj
                    </button>
                  </div>

                  {isMobileFiltersOpen && (
                    <div className="mt-3">
                      <ItemFilters
                        fixedType={view}
                        onResults={handleResults}
                        onPaginationChange={handlePaginationChange}
                        mobilePanel
                        onClose={() => setIsMobileFiltersOpen(false)}
                      />
                    </div>
                  )}
                </div>
              )}

              {showFilters && (
                <div className="mx-auto max-w-md lg:max-w-6xl">
                  <button
                    type="button"
                    onClick={goToAdd}
                    className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    + Dodaj {typLabel}
                  </button>
                </div>
              )}

              <ItemsList
                filteredItems={filterResults}
                onModeChange={setIsDetailView}
                pagination={pagination}
                onLoadMore={loadMore}
              />
            </div>
          ) : (
            <ItemForm
              fixedType={view}
              onSaved={backToListAfterSave}
              onCancel={backToListAfterSave}
            />
          )}
        </main>
      </div>
    </AuthGate>
  )
}

export default App