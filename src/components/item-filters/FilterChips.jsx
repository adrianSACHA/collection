/**
 * Chipy aktywnych filtrów. Każdy chip usuwa pojedynczy filtr po kliknięciu;
 * obok znajduje się przycisk "Wyczyść wszystko".
 *
 * `chips` to tablica: { key, label, onClear }.
 */
export default function FilterChips({ chips, onClearAll }) {
  if (!chips || chips.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => chip.onClear(chip)}
          aria-label={`Usuń filtr ${chip.label}`}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          {chip.label}
          <span aria-hidden="true">✕</span>
        </button>
      ))}

      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-gray-500 underline hover:text-gray-700"
        >
          Wyczyść wszystko
        </button>
      )}
    </div>
  )
}
