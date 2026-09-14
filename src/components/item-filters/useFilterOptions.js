import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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
        const { data, error: err } = await supabase
          .from('items')
          .select('mennica, material')

        if (err) throw err

        if (!active) return

        const mennice = new Set()
        const materialy = new Set()

        for (const row of data || []) {
          if (row.mennica?.trim()) mennice.add(row.mennica.trim())
          if (row.material?.trim()) materialy.add(row.material.trim())
        }

        setMennicaOptions(Array.from(mennice).sort())
        setMaterialOptions(Array.from(materialy).sort())
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
