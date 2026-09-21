import { cloneElement, isValidElement } from 'react'

/**
 * Pole formularza: label + kontrolka + komunikat błędu.
 * Używa `children` jako kontrolki (input/select/textarea) albo renderuje input.
 *
 * Gdy podano `htmlFor`, komunikat błędu i podpowiedź są powiązane z kontrolką
 * przez `aria-describedby`, a błąd ustawia `aria-invalid` - dzięki temu czytnik
 * ekranu odczyta je razem z polem. Atrybuty wstrzykujemy wyłącznie do natywnych
 * elementów (input/select/textarea) i nie nadpisujemy tych, które kontrolka
 * ustawiła sama (np. w QuickAddForm).
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
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined

  const describedBy = [
    error ? errorId : null,
    hint && !error ? hintId : null,
  ]
    .filter(Boolean)
    .join(' ')

  const childProps = isValidElement(children) ? children.props : {}

  const isNativeControl =
    Boolean(htmlFor) &&
    isValidElement(children) &&
    typeof children.type === 'string'

  const control = isNativeControl
    ? cloneElement(children, {
        'aria-invalid': error ? true : childProps['aria-invalid'],
        'aria-describedby':
          describedBy || childProps['aria-describedby'] || undefined,
      })
    : children

  return (
    <div className={className}>
      {label &&
        (htmlFor ? (
          <label
            htmlFor={htmlFor}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        ) : (
          <span className="mb-1 block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </span>
        ))}

      {control}

      {hint && !error && (
        <span id={hintId} className="mt-1 block text-xs text-gray-500">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
