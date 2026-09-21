import { useEffect, useState } from 'react'
import { listFacets } from '../../collection/collectionApi'

/**
 * Hook pobierający opcje słownikowe do filtrów:
 *  - `mennicaOptions` / `materialOptions` - unikalne wartości zebrane z kolekcji.
 */
export function useFilterOptions() {
  const [mennicaOptions, setMennicaOptions] = useState([])
  const [materialOptions, setMaterialOptions] = useState([])

  // Unikalne wartości mennicy i materiału z kolekcji użytkownika (do selectów).
  useEffect(() => {
    let active = true

    async function loadFacetOptions() {
      try {
        const { mennica, material } = await listFacets()

        if (!active) return

        setMennicaOptions(mennica)
        setMaterialOptions(material)
      } catch (err) {
        console.error('Błąd wczytywania opcji filtrów:', err)
      }
    }

    loadFacetOptions()

    return () => {
      active = false
    }
  }, [])

  return {
    mennicaOptions,
    materialOptions,
  }
}
