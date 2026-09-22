import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import FilterModal from './components/FilterModal'
import ItemsList from './components/ItemsList'
import AuthGate from './components/AuthGate'
import LoadingFallback from './components/LoadingFallback'
import MobileBottomNav from './components/navigation/MobileBottomNav'
import DesktopSidebar from './components/navigation/DesktopSidebar'
import CollectionSwitcherSheet from './components/navigation/CollectionSwitcherSheet'
import MoreSheet from './components/navigation/MoreSheet'
import FiltersPanel from './components/collection/FiltersPanel'
import { exportItemsToCsv } from './components/items-list/exportCsv'
import { countByType, listAllItems } from './collection/collectionApi'
import { supabase } from './lib/supabase'
import { useCollection } from './collection/useCollection'
import { CollectionContext } from './collection/collectionContext'

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

/*
 * CollectionApp montuje się DOPIERO wewnątrz <AuthGate> (po zalogowaniu).
 * Dzięki temu useCollection nie odpytuje bazy bez sesji, a po zalogowaniu
 * zawsze startuje ze świeżym, poprawnym zapytaniem.
 *
 * Cały stan filtrów i paginacji żyje w useCollection; komponenty-dzieci
 * (panel filtrów) czytają go przez CollectionContext.
 */
function CollectionApp() {
  const [view, setView] = useState(getInitialView)
  const [mode, setMode] = useState('lista')
  const [layout, setLayout] = useState(getInitialLayout) // 'lista' | 'galeria'
  // Tryb dodawania: 'szybki' (formularz ze zdjęciem) lub 'pelny' (wszystkie pola)
  const [addMode, setAddMode] = useState('szybki')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [isDetailView, setIsDetailView] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    getInitialSidebarCollapsed
  )

  // Liczniki pozycji per typ (do nawigacji w sidebarze). `null` => nieznane,
  // wtedy nie pokazujemy badge'a (żadnych pustych miejsc na liczniki).
  const [typeCounts, setTypeCounts] = useState({
    banknot: null,
    moneta: null,
  })

  // Mobilne bottom sheety (Kolekcja / Więcej).
  const [isCollectionSheetOpen, setIsCollectionSheetOpen] = useState(false)
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false)

  // Refy przycisków dolnego menu - służą do przywrócenia focusu po zamknięciu sheeta.
  const addButtonRef = useRef(null)
  const moreButtonRef = useRef(null)
  const collectionButtonRef = useRef(null)

  // Jedno źródło prawdy: filtry + wyniki + paginacja.
  const collection = useCollection({ fixedType: view })
  const {
    items,
    pagination,
    draft,
    loading,
    error,
    activeFilterCount,
    clear: clearFilters,
    refresh,
    loadMore,
    syncType,
  } = collection

  // Liczniki pozycji per typ - lekkie zapytania `head: true` (bez wierszy),
  // schowane za modułem danych kolekcji.
  useEffect(() => {
    async function loadTypeCounts() {
      setTypeCounts(await countByType())
    }

    loadTypeCounts()
  }, [])

  // Wymusza ponowne wczytanie listy z bieżącymi filtrami po zapisie/usunięciu.
  const refreshList = useCallback(() => {
    refresh()
    countByType().then((counts) => setTypeCounts(counts))
  }, [refresh])

  const closeMobileFilters = useCallback(() => {
    setIsMobileFiltersOpen(false)
  }, [])

  // Eksport CSV: pobiera CAŁY zbiór spełniający bieżące filtry (nie tylko
  // wczytane strony listy) i pobiera plik.
  const handleExportAll = useCallback(async () => {
    if (!draft || isExporting) return

    try {
      setIsExporting(true)
      setExportError(null)

      const allItems = await listAllItems(draft)

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
  }, [draft, isExporting])

  const switchType = (nextType) => {
    setView(nextType)
    window.localStorage.setItem(VIEW_STORAGE_KEY, nextType)
    setMode('lista')
    setIsDetailView(false)
    setIsMobileFiltersOpen(false)
    // Reset filtrów + przeładowanie listy dla nowego typu; listę dodatkowo
    // resetujemy kluczem `key={view}` na ItemsList.
    syncType(nextType)
  }

  const goToAdd = (nextAddMode = 'szybki') => {
    setAddMode(nextAddMode)
    setMode('dodaj')
    setIsDetailView(false)
    // Formularz to osobny widok - przy wejściu zamykamy mobilne sheety,
    // żeby w danej chwili otwarty był tylko jeden element.
    setIsCollectionSheetOpen(false)
    setIsMoreSheetOpen(false)
    setIsMobileFiltersOpen(false)
  }

  // "Zamiast tego dodaj monetę/banknot": przełącza typ formularza szybkiego
  // dodawania bez powrotu do listy (zostajemy w trybie dodawania).
  const switchAddType = (nextType) => {
    if (nextType === view) return
    setView(nextType)
    window.localStorage.setItem(VIEW_STORAGE_KEY, nextType)
    setAddMode('szybki')
    setMode('dodaj')
    // Utrzymaj filtry spójne z nowym typem (używane po powrocie do listy).
    syncType(nextType)
  }

  const backToListAfterSave = () => {
    setMode('lista')
    setIsDetailView(false)
    refreshList()
  }

  // --- Nawigacja mobilna (dolne menu) ---

  // "Filtry": otwiera panel filtrów i sortowania (FilterModal).
  const openMobileFilters = () => {
    setIsCollectionSheetOpen(false)
    setIsMoreSheetOpen(false)
    setIsMobileFiltersOpen(true)
  }

  // "Pełny formularz": przełącza szybki formularz na pełny ItemForm.
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

  const typLabel = view === 'moneta' ? 'monetę' : 'banknot'
  const showFilters = mode === 'lista' && !isDetailView
  const canExport = Array.isArray(items) && items.length > 0

  // Aktywna pozycja dolnego menu mobilnego.
  const activeMobileTab = isMobileFiltersOpen
    ? 'filtry'
    : mode === 'lista' && !isDetailView
      ? 'kolekcja'
      : null

  return (
    <CollectionContext.Provider value={{ ...collection, fixedType: view }}>
      <div className="min-h-screen flex flex-col lg:flex-row lg:bg-gray-50">
        {/* Sidebar (desktop). Komponent trzyma układ, ikony i akcje; stan
            (widok, zwinięcie, liczniki, filtry) pozostaje wyżej (App/useCollection).
            Panel filtrów czyta stan z kontekstu, więc nie trzeba już przekazywać
            ref-a ani callbacków. */}
        <DesktopSidebar
          collapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          view={view}
          onSwitchType={switchType}
          typeCounts={typeCounts}
          showFilters={showFilters}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          canExport={canExport}
          onExport={handleExportAll}
          isExporting={isExporting}
          exportError={exportError}
          totalCount={pagination.total}
          onQuickAdd={() => goToAdd('szybki')}
          onFullForm={openFullForm}
          typLabel={typLabel}
          onLogout={() => supabase.auth.signOut()}
        />

        <main className="flex-1 pb-24 lg:overflow-auto lg:pb-0">
          {mode === 'lista' ? (
            <div className="space-y-4 p-4 lg:p-6">
              {/* Panel filtrów/sortowania na mobile. Ten sam FiltersPanel co w
                  sidebarze, ale sterowany wspólnym kontekstem - brak drugiego
                  biegu zapytania i rozjazdu stanu. */}
              {showFilters && (
                <div className="lg:hidden">
                  <FilterModal
                    isOpen={isMobileFiltersOpen}
                    onClose={closeMobileFilters}
                  >
                    <FiltersPanel
                      hideHeader
                      onClose={closeMobileFilters}
                    />
                  </FilterModal>
                </div>
              )}

              {showFilters && (
                <div className="mx-auto flex max-w-md items-center justify-between gap-3 lg:max-w-6xl">
                  {/* Liczba pozycji trzyma się tytułu (nie jest samotnym tekstem
                      w pustej przestrzeni). Główne akcje dodawania są w sidebarze. */}
                  <div className="flex min-w-0 items-baseline gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {view === 'moneta' ? 'Monety' : 'Banknoty'}
                    </h2>

                    {pagination.total > 0 && (
                      <span className="truncate text-sm text-gray-500">
                        {pagination.total} pozycji
                      </span>
                    )}
                  </div>

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
                key={view}
                filteredItems={items}
                loading={loading}
                error={error}
                onModeChange={setIsDetailView}
                onItemsChanged={refreshList}
                pagination={pagination}
                onLoadMore={loadMore}
                viewMode={layout}
              />
            </div>
          ) : addMode === 'szybki' ? (
            <Suspense fallback={<LoadingFallback label="Wczytywanie formularza…" />}>
              <QuickAddForm
                key={view}
                fixedType={view}
                onSaved={backToListAfterSave}
                onCancel={backToListAfterSave}
                onOpenFullForm={openFullForm}
                onSwitchType={switchAddType}
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

        {/* Dolna nawigacja mobilna (< lg) + mobilne bottom sheety. */}
        {mode !== 'dodaj' && (
          <MobileBottomNav
            activeTab={activeMobileTab}
            view={view}
            onOpenCollection={() => setIsCollectionSheetOpen(true)}
            onOpenFilters={openMobileFilters}
            onAdd={() => goToAdd('szybki')}
            onOpenMore={() => setIsMoreSheetOpen(true)}
            addButtonRef={addButtonRef}
            moreButtonRef={moreButtonRef}
            collectionButtonRef={collectionButtonRef}
          />
        )}

        <CollectionSwitcherSheet
          isOpen={isCollectionSheetOpen}
          onClose={() => setIsCollectionSheetOpen(false)}
          view={view}
          typeCounts={typeCounts}
          onSelectType={switchType}
          triggerRef={collectionButtonRef}
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
    </CollectionContext.Provider>
  )
}

function App() {
  // Bramka auth na zewnątrz: CollectionApp (i jego zapytania) startuje dopiero
  // po zalogowaniu, więc useCollection nigdy nie odpytuje bazy bez sesji.
  return (
    <AuthGate>
      <CollectionApp />
    </AuthGate>
  )
}

export default App