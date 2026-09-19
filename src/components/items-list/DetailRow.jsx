export default function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return (
    <div className="flex justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="flex-shrink-0 text-gray-500">{label}</span>
      {/* min-w-0 pozwala polu tekstowemu zwężyć się poniżej szerokości treści
          (inaczej długi wyraz rozpycha flex i wychodzi poza kartę).
          whitespace-pre-wrap zachowuje ręczne podziały linii, a
          overflow-wrap/break-word radzą sobie z długimi linkami i ID. */}
      <span className="min-w-0 max-w-full flex-1 whitespace-pre-wrap break-words text-right font-medium text-gray-800 [overflow-wrap:anywhere]">
        {value}
      </span>
    </div>
  )
}
