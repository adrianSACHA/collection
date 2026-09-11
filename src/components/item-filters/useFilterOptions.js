import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook pobierający opcje słownikowe do filtrów:
 *  - `stanyZachowania` - słownik { kod, etykieta, opis } (kolejność z bazy),
 *  - `mennicaOptions` / `materialOptions` - unikalne wartości zebrane z kolekcji.
 *
 * Zwraca `error` z komunikatem, gdy nie udało się wczytać stanów zachowania.
 */
export function useFilterOptions() {
  const [stanyZachowania, setStanyZachowania] = useState([])
  const [mennicaOptions, setMennicaOptions] = useState([])
  const [materialOptions, setMaterialOptions] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadStanyZachowania() {
      try {
        const { data, error: err } = await supabase
          .from('stany_zachowania')
          .select('kod, etykieta, opis')
          .order('kolejnosc', { ascending: true })

        if (err) throw err

        if (active) {
          setStanyZachowania(data || [])
        }
      } catch (err) {
        console.error('Błąd wczytywania stanów zachowania:', err)

        if (active) {
          setError('Nie udało się wczytać stanów zachowania.')
        }
      }
    }

    loadStanyZachowania()

    return () => {
      active = false
    }
  }, [])

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
    stanyZachowania,
    mennicaOptions,
    materialOptions,
    error,
  }
}
