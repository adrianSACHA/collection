// Dolna nawigacja mobilna (widoczna tylko < lg).
// Czysto prezentacyjna: cały stan (aktywna zakładka, otwarcie sheetów,
// przełączanie widoków) znajduje się w App.jsx i jest przekazywany przez propsy.
// Nie tworzy żadnego własnego stanu kolekcji/filtrów.

function CollectionIcon() {
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

function FilterIcon() {
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
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
      className="h-6 w-6"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <circle cx="5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19" cy="12" r="1.9" />
    </svg>
  )
}

export default function MobileBottomNav({
  activeTab,
  onOpenCollection,
  onOpenFilters,
  onOpenAdd,
  onOpenMore,
  addButtonRef,
  moreButtonRef,
}) {
  const tabClass = (isActive) =>
    `flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 ${
      isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
    }`

  return (
    <nav
      aria-label="Główna nawigacja"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-around gap-1 px-2">
        <button
          type="button"
          onClick={onOpenCollection}
          aria-current={activeTab === 'kolekcja' ? 'page' : undefined}
          className={tabClass(activeTab === 'kolekcja')}
        >
          <CollectionIcon />
          <span>Kolekcja</span>
        </button>

        <button
          type="button"
          onClick={onOpenFilters}
          aria-current={activeTab === 'filtry' ? 'page' : undefined}
          className={tabClass(activeTab === 'filtry')}
        >
          <FilterIcon />
          <span>Filtry</span>
        </button>

        {/* Dodaj - większy, okrągły, niebieski przycisk lekko wysunięty nad pasek */}
        <div className="relative flex flex-1 justify-center">
          <button
            ref={addButtonRef}
            type="button"
            onClick={onOpenAdd}
            aria-label="Dodaj do kolekcji"
            title="Dodaj do kolekcji"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-blue-300 active:bg-blue-800"
          >
            <PlusIcon />
          </button>
        </div>

        <button
          ref={moreButtonRef}
          type="button"
          onClick={onOpenMore}
          aria-current={activeTab === 'wiecej' ? 'page' : undefined}
          className={tabClass(activeTab === 'wiecej')}
        >
          <MoreIcon />
          <span>Więcej</span>
        </button>
      </div>
    </nav>
  )
}
