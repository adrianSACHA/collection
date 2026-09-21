// Jeden styl wiersza akcji w bottom sheetach:
// ikona po lewej, etykieta (+ opcjonalny opis), opcjonalny licznik po prawej.
// `active` wyróżnia wybraną pozycję (np. aktywny typ kolekcji).
export default function BottomSheetActionItem({
  icon,
  label,
  description,
  count,
  active = false,
  disabled = false,
  onClick,
}) {
  const showCount = count !== null && count !== undefined

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'true' : undefined}
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
      }`}
    >
      {icon && (
        <span
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
            active ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-600'
          }`}
        >
          {icon}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>

        {description && (
          <span className="mt-0.5 block text-sm text-gray-500">
            {description}
          </span>
        )}
      </span>

      {showCount && (
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
            active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}
