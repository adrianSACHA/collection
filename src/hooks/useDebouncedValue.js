import { useEffect, useState } from 'react'

/**
 * Zwraca wartość, która aktualizuje się z opóźnieniem po tym,
 * jak `value` przestanie się zmieniać przez `delay` ms.
 * Przydatne do pól wyszukiwania, żeby nie odpytywać bazy przy każdej literze.
 */
export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}