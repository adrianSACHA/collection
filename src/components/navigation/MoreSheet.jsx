import BottomSheet from '../sheets/BottomSheet'
import BottomSheetHeader from '../sheets/BottomSheetHeader'
import BottomSheetActionItem from '../sheets/BottomSheetActionItem'

// Mobilny bottom sheet "Więcej" (na wspólnych primitywach).
// Pokazuje WYŁĄCZNIE akcje, które faktycznie istnieją w aplikacji:
//   - Eksport CSV (handleExportAll w App.jsx),
//   - Wylogowanie (signOut z authApi, przez App.jsx).

const TITLE_ID = 'more-sheet-title'

function DownloadIcon() {
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
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function LogoutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

export default function MoreSheet({
  isOpen,
  onClose,
  onExport,
  isExporting = false,
  exportError = null,
  onLogout,
  triggerRef,
}) {
  const runAndClose = (handler) => {
    handler?.()
    onClose?.()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      ariaLabelledby={TITLE_ID}
    >
      <BottomSheetHeader id={TITLE_ID} title="Więcej" onClose={onClose} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-2">
        <BottomSheetActionItem
          icon={<DownloadIcon />}
          label={isExporting ? 'Eksportowanie…' : 'Eksport CSV'}
          disabled={isExporting}
          onClick={() => runAndClose(onExport)}
        />

        <BottomSheetActionItem
          icon={<LogoutIcon />}
          label="Wyloguj"
          onClick={() => runAndClose(onLogout)}
        />
      </div>

      {exportError && (
        <p className="px-4 pb-4 text-sm text-red-600">{exportError}</p>
      )}
    </BottomSheet>
  )
}
