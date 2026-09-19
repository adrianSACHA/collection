import { useEffect, useState } from 'react'

// Dolna nawigacja mobilna (widoczna tylko < lg).
// Stan kolekcji/filtrów pozostaje w App.jsx (przekazywany przez propsy).
// Jedyny lokalny stan to rozwinięcie menu "Kolekcja" (przełącznik
// Banknoty/Monety) - czysto UI. Zastąpiło ono górny pasek zakładek.

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

function BanknoteIcon() {
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
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function CoinIcon() {
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
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

// Licznik elementów - nic nie renderujemy, gdy nie da się go obliczyć.
function CountBadge({ value }) {
  if (value === null || value === undefined) return null

  return (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gray-500">
      {value}
    </span>
  )
}

export default function MobileBottomNav({
  activeTab,
  view,
  typeCounts,
  onSwitchType,
  onOpenFilters,
  onOpenAdd,
  onOpenMore,
  addButtonRef,
  moreButtonRef,
}) {
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)

  const closeCollection = () => setIsCollectionOpen(false)

  useEffect(() => {
    if (!isCollectionOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsCollectionOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCollectionOpen])

  const tabClass = (isActive) =>
    `flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300 ${
      isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
    }`

  // Wybór modułu zamyka menu i przełącza widok (switchType w App wraca do listy).
  const handleSelectType = (type) => {
    setIsCollectionOpen(false)
    onSwitchType?.(type)
  }

  return (
    <>
      {/* Tło zamykające menu po kliknięciu obok (poniżej paska, który zostaje klikalny). */}
      {isCollectionOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={closeCollection}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label="Główna nawigacja"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {/* Rozwijane menu kolekcji (Banknoty / Monety) - rozwija się nad paskiem. */}
        {isCollectionOpen && (
          <div
            id="mobile-collection-menu"
            className="absolute inset-x-2 bottom-full mb-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg"
          >
            <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Kolekcja
            </p>

            <button
              type="button"
              onClick={() => handleSelectType('banknot')}
              aria-current={view === 'banknot' ? 'true' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                view === 'banknot'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BanknoteIcon />
              <span className="flex-1">Banknoty</span>
              <CountBadge value={typeCounts?.banknot ?? null} />
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('moneta')}
              aria-current={view === 'moneta' ? 'true' : undefined}
              className={`mt-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                view === 'moneta'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CoinIcon />
              <span className="flex-1">Monety</span>
              <CountBadge value={typeCounts?.moneta ?? null} />
            </button>
          </div>
        )}

        <div className="mx-auto flex max-w-md items-center justify-around gap-1 px-2">
          <button
            type="button"
            onClick={() => setIsCollectionOpen((open) => !open)}
            aria-expanded={isCollectionOpen}
            aria-controls="mobile-collection-menu"
            aria-current={activeTab === 'kolekcja' ? 'page' : undefined}
            className={tabClass(activeTab === 'kolekcja' || isCollectionOpen)}
          >
            <CollectionIcon />
            <span>Kolekcja</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeCollection()
              onOpenFilters()
            }}
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
              onClick={() => {
                closeCollection()
                onOpenAdd()
              }}
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
            onClick={() => {
              closeCollection()
              onOpenMore()
            }}
            aria-current={activeTab === 'wiecej' ? 'page' : undefined}
            className={tabClass(activeTab === 'wiecej')}
          >
            <MoreIcon />
            <span>Więcej</span>
          </button>
        </div>
      </nav>
    </>
  )
}
