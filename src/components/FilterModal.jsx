import BottomSheet from './sheets/BottomSheet'
import BottomSheetHeader from './sheets/BottomSheetHeader'

// Modal filtrów (mobile) zbudowany na wspólnym BottomSheet - ten sam handle,
// narożniki, overlay i obsługa klawiatury/gestów co pozostałe sheety.
// `children` to zawartość (np. <FiltersPanel onClose={...} hideHeader />).

const TITLE_ID = 'filter-sheet-title'

export default function FilterModal({ isOpen, onClose, triggerRef, children }) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      ariaLabelledby={TITLE_ID}
    >
      <BottomSheetHeader
        id={TITLE_ID}
        title="Filtry i sortowanie"
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">
        {children}
      </div>
    </BottomSheet>
  )
}
