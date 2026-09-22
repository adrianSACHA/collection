import { useEffect } from 'react'

/**
 * Oznacza „tło" otwartego dialogu jako `inert`.
 *
 * Bez tego pułapka na Tab pilnuje tylko klawiatury, ale czytnik ekranu dalej
 * może wirtualnym kursorem wyjść poza modal i przeczytać treść pod spodem.
 * `inert` usuwa poddrzewo z kolejności focusu ORAZ z drzewa dostępności
 * (implikuje `aria-hidden="true"`), więc załatwia oba problemy naraz.
 *
 * Dialogi nie są portalowane do `document.body` - żyją w drzewie aplikacji,
 * więc „tło" to nie jeden kontener, tylko całe rodzeństwo na ścieżce od
 * dialogu w górę do `<body>`. Ten sam element bywa tłem kilku dialogów naraz
 * (np. kadrowanie otwarte wewnątrz bottom sheeta), dlatego trzymamy licznik
 * „uwięzień" i zdejmujemy `inert` dopiero po ostatnim.
 *
 * Element z atrybutem `data-inert-exempt` jest pomijany - używamy tego dla
 * warstwy toastów, która musi zostać „żywa" (czytana przez czytnik) także
 * wtedy, gdy pod nią wisi modal.
 */

const holdCounts = new WeakMap()

function hold(element) {
  const count = holdCounts.get(element) ?? 0
  holdCounts.set(element, count + 1)

  if (count === 0) element.setAttribute('inert', '')
}

function release(element) {
  const count = holdCounts.get(element) ?? 0

  if (count <= 1) {
    holdCounts.delete(element)
    element.removeAttribute('inert')
    return
  }

  holdCounts.set(element, count - 1)
}

// Elementy, których nie ma sensu (i nie wypada) oznaczać jako `inert`.
const IGNORED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'LINK',
  'META',
  'TEMPLATE',
  'TITLE',
  'BASE',
])

function isSkippable(element) {
  if (IGNORED_TAGS.has(element.tagName)) return true
  // Custom element, np. nakładka błędów Vite w trybie dev - uwięzienie jej
  // odbierałoby deweloperowi możliwość odczytania błędu.
  if (element.tagName.includes('-')) return true
  if (element.hasAttribute('data-inert-exempt')) return true
  // Szanujemy `inert` nadany przez autora - nie naszą książką licznikową.
  if (element.hasAttribute('inert') && !holdCounts.has(element)) return true

  return false
}

function backgroundOf(container) {
  const background = []
  let node = container

  while (node && node.parentElement && node !== document.body) {
    for (const sibling of node.parentElement.children) {
      if (sibling === node) continue
      if (isSkippable(sibling)) continue

      background.push(sibling)
    }

    node = node.parentElement
  }

  return background
}

/**
 * @param {import('react').RefObject<HTMLElement>} containerRef - element dialogu
 * @param {boolean} active - czy dialog jest otwarty
 */
export function useInertBackground(containerRef, active) {
  useEffect(() => {
    if (!active) return undefined

    const container = containerRef.current
    if (!container) return undefined

    // Dialog ukryty CSS-em (np. sheet z `lg:hidden` na szerokim ekranie) nie
    // może unieruchomić widocznej aplikacji.
    if (container.getClientRects().length === 0) return undefined

    const background = backgroundOf(container)
    background.forEach(hold)

    return () => {
      background.forEach(release)
    }
  }, [containerRef, active])
}

export default useInertBackground
