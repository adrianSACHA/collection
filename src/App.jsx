import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import ItemFilters from './components/ItemFilters'
import FilterModal from './components/FilterModal'
import ItemsList from './components/ItemsList'
import AuthGate from './components/AuthGate'
import LoadingFallback from './components/LoadingFallback'
import MobileBottomNav from './components/navigation/MobileBottomNav'
import AddItemSheet from './components/navigation/AddItemSheet'
import MoreSheet from './components/navigation/MoreSheet'
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

// Małe ikony inline dla mobilnego przełącznika Lista / Galeria
// (projekt nie używa zewnętrznej biblioteki ikon).
function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}

function GalleryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
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

  // Mobilne bottom sheety (Dodaj / Więcej) - jedyne miejsce trzymające ich stan.
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false)
  // Zmiana klucza resetuje wewnętrzny stan ItemsList (np. powrót z detalu).
  const [listKey, setListKey] = useState(0)

  // Refy przycisków dolnego menu - służą do przywrócenia focusu po zamknięciu sheeta.
  const addButtonRef = useRef(null)
  const moreButtonRef = useRef(null)

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
    // Formularz to osobny widok - przy wejściu zamykamy mobilne sheety,
    // żeby w danej chwili otwarty był tylko jeden element.
    setIsAddSheetOpen(false)
    setIsMoreSheetOpen(false)
    setIsMobileFiltersOpen(false)
  }

  const backToListAfterSave = () => {
    setMode('lista')
    setIsDetailView(false)
  }

  // --- Nawigacja mobilna (dolne menu) ---

  // "Kolekcja": powrót do istniejącego głównego widoku listy.
  const openCollection = () => {
    setIsAddSheetOpen(false)
    setIsMoreSheetOpen(false)
    setIsMobileFiltersOpen(false)
    if (isDetailView) {
      // Remount ItemsList, aby wyczyścić jego wewnętrzny wybór (widok szczegółów).
      setListKey((key) => key + 1)
    }
    setMode('lista')
    setIsDetailView(false)
  }

  // "Filtry": otwiera istniejący panel filtrów i sortowania (FilterModal).
  const openMobileFilters = () => {
    setIsAddSheetOpen(false)
    setIsMoreSheetOpen(false)
    setIsMobileFiltersOpen(true)
  }

  // "Dodaj": z dolnego menu otwiera SZYBKI formularz (QuickAddForm) dla
  // wybranego typu. Pełny ItemForm otwiera się dopiero po kliknięciu
  // przycisku "Pełny formularz" (na desktopie lub wewnątrz szybkiego formularza).
  const startQuickAdd = (type) => {
    if (type !== view) switchType(type)
    goToAdd('szybki')
  }

  // "Pełny formularz": przełącza szybki formularz na pełny ItemForm
  // dla aktualnego typu (fixedType = view).
  const openFullForm = () => {
    goToAdd('pelny')
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

  // Aktywna pozycja dolnego menu mobilnego.
  const activeMobileTab = isMobileFiltersOpen
    ? 'filtry'
    : mode === 'lista' && !isDetailView
      ? 'kolekcja'
      : null

  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col lg:flex-row lg:bg-gray-50">
        {/* Górna nawigacja mobilna */}
        <div className="sticky top-0 z-10 flex border-b bg-white shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => switchType('moneta')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
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
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
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

        <main className="flex-1 pb-24 lg:overflow-auto lg:pb-0">
          {mode === 'lista' ? (
            <div className="space-y-4 p-4 lg:p-6">
              {/* Panel filtrów/sortowania na mobile otwiera przycisk "Filtry"
                  z dolnego menu. Stary przycisk nad listą usunięty, żeby lista
                  zaczynała się wyżej. Modal zostaje zamontowany jak wcześniej. */}
              {showFilters && (
                <div className="lg:hidden">
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

              {/* Szybkie/pełne dodawanie widoczne tylko na desktopie (<lg ukryte;
                  na mobile ich rolę przejmuje przycisk "Dodaj" w dolnym menu). */}
              {showFilters && (
                <div className="mx-auto hidden max-w-md lg:block lg:max-w-6xl">
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

                  {/* Mobile: dwie małe ikony (stan viewMode bez zmian) */}
                  <div
                    role="group"
                    aria-label="Sposób wyświetlania"
                    className="inline-flex rounded-lg border border-gray-200 bg-white p-1 lg:hidden"
                  >
                    <button
                      type="button"
                      onClick={() => changeLayout('lista')}
                      aria-pressed={layout === 'lista'}
                      aria-label="Widok listy"
                      title="Lista"
                      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                        layout === 'lista'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <ListIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() => changeLayout('galeria')}
                      aria-pressed={layout === 'galeria'}
                      aria-label="Widok galerii"
                      title="Galeria"
                      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                        layout === 'galeria'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <GalleryIcon />
                    </button>
                  </div>

                  {/* Desktop: przyciski tekstowe (bez zmian) */}
                  <div
                    role="group"
                    aria-label="Sposób wyświetlania"
                    className="hidden rounded-lg border border-gray-200 bg-white p-1 lg:inline-flex"
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
                key={listKey}
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
                onOpenFullForm={openFullForm}
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

        {/* Dolna nawigacja mobilna (< lg) + mobilne bottom sheety.
            Widoczne tylko na mobile; na desktopie nic się nie zmienia. */}
        {mode !== 'dodaj' && (
          <MobileBottomNav
            activeTab={activeMobileTab}
            onOpenCollection={openCollection}
            onOpenFilters={openMobileFilters}
            onOpenAdd={() => setIsAddSheetOpen(true)}
            onOpenMore={() => setIsMoreSheetOpen(true)}
            addButtonRef={addButtonRef}
            moreButtonRef={moreButtonRef}
          />
        )}

        <AddItemSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          onAddCoin={() => startQuickAdd('moneta')}
          onAddBanknote={() => startQuickAdd('banknot')}
          triggerRef={addButtonRef}
        />

        <MoreSheet
          isOpen={isMoreSheetOpen}
          onClose={() => setIsMoreSheetOpen(false)}
          onExport={handleExportAll}
          isExporting={isExporting}
          exportError={exportError}
          onLogout={() => supabase.auth.signOut()}
          triggerRef={moreButtonRef}
        />
      </div>
    </AuthGate>
  )
}

export default App