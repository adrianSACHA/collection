import { useState, useEffect } from 'react'

/**
 * Zwraca null dopóki przeglądarka nie określi aktualnego breakpointu,
 * następnie true dla Tailwind "lg" (min-width: 1024px) i false dla mobile.
 * Dzięki null App.jsx nie montuje na moment niewłaściwej wersji ItemFilters
 * przy pierwszym renderze na desktopie.
 */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = (event) => setIsDesktop(event.matches)

    handleChange(mediaQuery)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}