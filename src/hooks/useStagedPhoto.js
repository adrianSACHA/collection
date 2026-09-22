import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Jedno „przygotowywane" zdjęcie: plik do wgrania, podgląd i oryginał do
 * wielokrotnego kadrowania.
 *
 * Trzy role, które łatwo pomylić:
 *  - `file`        - to, co trafi do uploadu (po przycięciu: przycięty JPEG),
 *  - `previewUrl`  - to, co widzi użytkownik,
 *  - `originalUrl` - źródło dla kadrowania, nietknięte przez „Przytnij".
 *
 * Kadrujemy zawsze od ORYGINAŁU, nigdy od poprzedniego kadru: przycięcie
 * przyciętego obrazu zjada piksele przy każdym podejściu, a po dwóch obrotach
 * o 90° obraz wychodzi poza kadr i nie da się go już „oddalić".
 *
 * Hook jest jedynym właścicielem object URL-i - sam je tworzy i zwalnia
 * (także przy odmontowaniu), więc komponent nie musi o tym pamiętać.
 *
 * @returns {{
 *   file: File|null,
 *   previewUrl: string|null,
 *   originalUrl: string|null,
 *   canCrop: boolean,
 *   select: (file: File) => void,
 *   clear: () => void,
 *   applyCrop: (blob: Blob) => File|null,
 * }}
 */

const EMPTY = { file: null, previewUrl: null, originalUrl: null }

// Zwalniamy oba adresy. Świeżo wybrane zdjęcie ma podgląd i oryginał pod tym
// samym URL-em, więc zdejmujemy go wtedy tylko raz.
function releaseUrls({ previewUrl, originalUrl }) {
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  if (originalUrl && originalUrl !== previewUrl) URL.revokeObjectURL(originalUrl)
}

export function useStagedPhoto() {
  const [staged, setStaged] = useState(EMPTY)

  // Ref jest źródłem prawdy dla rewokacji: handlery muszą widzieć bieżące
  // URL-e, a sprzątanie przy odmontowaniu - ostatnie, nie te z pierwszego
  // renderu. Nie dotykamy go w updaterach stanu, bo StrictMode wywołuje je
  // dwukrotnie, a rewokacja w updaterze unieważniłaby URL wciąż w użyciu.
  const stagedRef = useRef(EMPTY)

  const commit = useCallback((next) => {
    stagedRef.current = next
    setStaged(next)
  }, [])

  const select = useCallback(
    (nextFile) => {
      if (!nextFile) return

      releaseUrls(stagedRef.current)

      const url = URL.createObjectURL(nextFile)

      // Podgląd i oryginał startują jako ten sam adres - rozjeżdżają się
      // dopiero po pierwszym kadrowaniu.
      commit({ file: nextFile, previewUrl: url, originalUrl: url })
    },
    [commit]
  )

  const clear = useCallback(() => {
    releaseUrls(stagedRef.current)
    commit(EMPTY)
  }, [commit])

  const applyCrop = useCallback(
    (blob) => {
      const previous = stagedRef.current

      if (!previous.originalUrl) return null

      // Zwalniamy wyłącznie poprzedni PODGLĄD. Przed pierwszym kadrowaniem
      // podgląd pokrywa się z oryginałem, więc NIE wolno go unieważnić -
      // inaczej kolejne „Przytnij" dostałoby martwy URL.
      if (previous.previewUrl !== previous.originalUrl) {
        URL.revokeObjectURL(previous.previewUrl)
      }

      const croppedFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' })

      commit({
        file: croppedFile,
        previewUrl: URL.createObjectURL(croppedFile),
        originalUrl: previous.originalUrl,
      })

      return croppedFile
    },
    [commit]
  )

  useEffect(() => {
    return () => releaseUrls(stagedRef.current)
  }, [])

  return {
    file: staged.file,
    previewUrl: staged.previewUrl,
    originalUrl: staged.originalUrl,
    canCrop: Boolean(staged.originalUrl),
    select,
    clear,
    applyCrop,
  }
}

export default useStagedPhoto
