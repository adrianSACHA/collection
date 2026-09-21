import { useState } from 'react'
import FiltersPanel from '../collection/FiltersPanel'

// Desktopowy panel boczny: nawigacja kolekcji (Banknoty / Monety) + rozwijane
// filtry + główne akcje. Stan widoku/zwinięcia/liczników pochodzi z propsów,
// a stan filtrów - z CollectionContext (patrz useCollection).
//
// Panel filtrów (FiltersPanel) renderujemy zawsze (chowany CSS-em), ale jego
// stan i tak mieszka w kontekście - dzięki temu stan filtrów jest jeden,
// niezależnie od tego, czy panel jest widoczny.

/* --- Ikony (inline, bez zewnętrznej biblioteki) --- */

function BanknoteIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function CoinIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

function FilterIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChevronIcon({ open, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${className} transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CollapseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14 6l-6 6 6 6" />
      <path d="M19 5v14" />
    </svg>
  )
}

function ExpandIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10 6l6 6-6 6" />
      <path d="M5 5v14" />
    </svg>
  )
}

function PlusIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function LogoutIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M15 12H4m0 0l4-4m-4 4l4 4" />
      <path d="M10 4h7a2 2 0 012 2v12a2 2 0 01-2 2h-7" />
    </svg>
  )
}

// Licznik elementów po prawej stronie pozycji. Nie renderujemy nic, gdy
// wartości nie da się obliczyć (null/undefined) - brak pustych miejsc.
function CountBadge({ value, active }) {
  if (value === null || value === undefined) return null

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
        active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {value}
    </span>
  )
}

function NavItem({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={`flex w-full items-center gap-2.5 rounded-lg border-l-4 py-2 pr-2 pl-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
        active
          ? 'border-blue-600 bg-blue-50 text-blue-700'
          : 'border-transparent text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      <CountBadge value={count} active={active} />
    </button>
  )
}

// Pozycja nawigacji w zwiniętym panelu (rail): sama ikona + natywny tooltip.
function RailItem({ active, onClick, icon, label, count }) {
  const tooltip =
    count !== null && count !== undefined ? `${label} (${count})` : label

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tooltip}
      title={tooltip}
      aria-current={active ? 'true' : undefined}
      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {icon}
    </button>
  )
}

export default function DesktopSidebar({
  collapsed,
  onToggleCollapse,
  view,
  onSwitchType,
  typeCounts,
  showFilters,
  activeFilterCount,
  onClearFilters,
  canExport,
  onExport,
  isExporting,
  exportError,
  totalCount,
  onQuickAdd,
  onFullForm,
  typLabel,
  onLogout,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const openFiltersFromRail = () => {
    onToggleCollapse?.()
    setFiltersOpen(true)
  }

  const filterBadge =
    activeFilterCount > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
        {activeFilterCount}
      </span>
    ) : null

  return (
    <aside
      className={`hidden lg:flex lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:transition-[width] lg:duration-200 ${
        collapsed ? 'lg:w-16' : 'lg:w-[270px]'
      }`}
    >
      {/* Rozwinięty panel */}
      <div className={`min-h-0 flex-1 flex-col ${collapsed ? 'hidden' : 'flex'}`}>
        <div className="flex items-center justify-end px-2 pt-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Zwiń panel boczny"
            title="Zwiń panel boczny"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <CollapseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <nav aria-label="Kolekcja">
            <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Kolekcja
            </p>

            <div className="space-y-0.5">
              <NavItem
                active={view === 'banknot'}
                onClick={() => onSwitchType('banknot')}
                icon={<BanknoteIcon />}
                label="Banknoty"
                count={typeCounts?.banknot ?? null}
              />
              <NavItem
                active={view === 'moneta'}
                onClick={() => onSwitchType('moneta')}
                icon={<CoinIcon />}
                label="Monety"
                count={typeCounts?.moneta ?? null}
              />
            </div>
          </nav>

          {/* Główne akcje dodawania - tuż nad filtrami (nie na samym dole). */}
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={onQuickAdd}
              className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              + Szybko dodaj {typLabel}
            </button>

            <button
              type="button"
              onClick={onFullForm}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Pełny formularz
            </button>
          </div>

          {/* Rozwijana sekcja filtrów */}
          {showFilters && (
            <div className="mt-2 border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="sidebar-filters-panel"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                <FilterIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <span className="flex-1 text-left">Filtry</span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronIcon open={filtersOpen} />
              </button>

              {activeFilterCount > 0 && (
                <div className="px-2 pb-1 text-right">
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="rounded text-xs font-medium text-gray-500 underline transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    Wyczyść filtry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Panel filtrów - zawsze zamontowany, chowany CSS-em. */}
          <div
            id="sidebar-filters-panel"
            className={showFilters && filtersOpen ? 'mt-1' : 'hidden'}
          >
            <FiltersPanel embedded />
          </div>
        </div>

        {/* Dolny pasek: eksport + wylogowanie */}
        <div className="space-y-2 border-t border-gray-100 p-3">
          {canExport && (
            <div>
              <button
                type="button"
                onClick={onExport}
                disabled={isExporting}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                {isExporting
                  ? 'Eksportowanie…'
                  : `⬇ Eksport CSV${
                      typeof totalCount === 'number' ? ` (${totalCount})` : ''
                    }`}
              </button>

              {exportError && (
                <p className="mt-1 text-xs text-red-600">{exportError}</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            Wyloguj
          </button>
        </div>
      </div>

      {/* Zwinięty panel (rail z ikonami i tooltipami) */}
      {collapsed && (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1 py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Rozwiń panel boczny"
            title="Rozwiń panel boczny"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <ExpandIcon />
          </button>

          <nav
            aria-label="Kolekcja"
            className="mt-1 flex flex-col items-center gap-1"
          >
            <RailItem
              active={view === 'banknot'}
              onClick={() => onSwitchType('banknot')}
              icon={<BanknoteIcon />}
              label="Banknoty"
              count={typeCounts?.banknot ?? null}
            />
            <RailItem
              active={view === 'moneta'}
              onClick={() => onSwitchType('moneta')}
              icon={<CoinIcon />}
              label="Monety"
              count={typeCounts?.moneta ?? null}
            />
          </nav>

          {showFilters && (
            <button
              type="button"
              onClick={openFiltersFromRail}
              aria-label="Filtry"
              title="Filtry"
              className="relative mt-1 flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <FilterIcon className="h-5 w-5" />
              {filterBadge}
            </button>
          )}

          <button
            type="button"
            onClick={onQuickAdd}
            aria-label={`Szybko dodaj ${typLabel}`}
            title={`Szybko dodaj ${typLabel}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <PlusIcon />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onLogout}
            aria-label="Wyloguj"
            title="Wyloguj"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <LogoutIcon />
          </button>
        </div>
      )}
    </aside>
  )
}
