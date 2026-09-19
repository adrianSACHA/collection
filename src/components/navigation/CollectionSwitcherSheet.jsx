import BottomSheet from '../sheets/BottomSheet'
import BottomSheetHeader from '../sheets/BottomSheetHeader'
import BottomSheetActionItem from '../sheets/BottomSheetActionItem'

// Modalny bottom sheet do przełączania typu kolekcji (Banknoty / Monety).
// Zbudowany na wspólnych primitywach, więc ma ten sam handle, narożniki,
// overlay i obsługę klawiatury/gestów co pozostałe sheety.

const TITLE_ID = 'collection-sheet-title'

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

export default function CollectionSwitcherSheet({
  isOpen,
  onClose,
  view,
  typeCounts,
  onSelectType,
  triggerRef,
}) {
  const handleSelect = (type) => {
    if (type !== view) onSelectType?.(type)
    onClose?.()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      ariaLabelledby={TITLE_ID}
    >
      <BottomSheetHeader id={TITLE_ID} title="Kolekcja" onClose={onClose} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-2">
        <BottomSheetActionItem
          icon={<BanknoteIcon />}
          label="Banknoty"
          count={typeCounts?.banknot ?? null}
          active={view === 'banknot'}
          onClick={() => handleSelect('banknot')}
        />

        <BottomSheetActionItem
          icon={<CoinIcon />}
          label="Monety"
          count={typeCounts?.moneta ?? null}
          active={view === 'moneta'}
          onClick={() => handleSelect('moneta')}
        />
      </div>
    </BottomSheet>
  )
}
