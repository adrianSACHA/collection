/**
 * Pole formularza: label + kontrolka + komunikat błędu.
 * Używa `children` jako kontrolki (input/select/textarea) albo renderuje input.
 */
export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
