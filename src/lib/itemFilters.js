// Wspólna logika filtrów/sortowania kolekcji.
// Jedno źródło prawdy dla listy (ItemFilters) i eksportu CSV,
// żeby wyniki filtra i eksportu były zawsze spójne.

export const SORT_OPTIONS = [
  {
    value: 'created_desc',
    label: 'Najnowsze dodane',
    column: 'created_at',
    ascending: false,
  },
  {
    value: 'created_asc',
    label: 'Najstarsze dodane',
    column: 'created_at',
    ascending: true,
  },
  {
    value: 'rok_desc',
    label: 'Rok: najnowszy → najstarszy',
    column: 'rok',
    ascending: false,
  },
  {
    value: 'rok_asc',
    label: 'Rok: najstarszy → najnowszy',
    column: 'rok',
    ascending: true,
  },
  {
    value: 'cena_asc',
    label: 'Cena zakupu: rosnąco',
    column: 'cena_zakupu',
    ascending: true,
  },
  {
    value: 'cena_desc',
    label: 'Cena zakupu: malejąco',
    column: 'cena_zakupu',
    ascending: false,
  },
  {
    value: 'ilosc_desc',
    label: 'Ilość: malejąco',
    column: 'ilosc',
    ascending: false,
  },
]

export const DEFAULT_SORT = 'created_desc'

/**
 * Zwraca znormalizowany obiekt filtrów (puste stringi / typ='wszystkie').
 * `fixedType` (zakładka) nadpisuje typ, gdy jest ustawiony.
 */
export function getDefaultFilters(fixedType) {
  return {
    nominal: '',
    kraj: '',
    rok: '',
    typ: fixedType || 'wszystkie',
    znakWodny: '',
    mennica: '',
    material: '',
    sortBy: DEFAULT_SORT,
  }
}

/**
 * Nakłada wartości filtrów na zapytanie Supabase (bez paginacji/sortowania).
 * `filters` to obiekt w formacie z getDefaultFilters.
 */
export function applyFiltersToQuery(query, filters) {
  if (filters.nominal?.trim()) {
    query = query.ilike('nominal', `%${filters.nominal.trim()}%`)
  }

  if (filters.kraj?.trim()) {
    query = query.ilike('kraj', `%${filters.kraj.trim()}%`)
  }

  if (filters.rok?.trim()) {
    const rokNum = parseInt(filters.rok, 10)
    if (!Number.isNaN(rokNum)) {
      query = query.eq('rok', rokNum)
    }
  }

  if (filters.typ && filters.typ !== 'wszystkie') {
    query = query.eq('typ', filters.typ)
  }

  if (filters.znakWodny?.trim()) {
    query = query.ilike('znak_wodny', `%${filters.znakWodny.trim()}%`)
  }

  if (filters.mennica?.trim()) {
    query = query.eq('mennica', filters.mennica.trim())
  }

  if (filters.material?.trim()) {
    query = query.eq('material', filters.material.trim())
  }

  return query
}

/**
 * Zwraca opcję sortowania dla wartości `sortBy` (z fallbackiem na domyślną).
 */
export function getSortOption(sortBy) {
  return (
    SORT_OPTIONS.find((option) => option.value === sortBy) || SORT_OPTIONS[0]
  )
}

/**
 * Dokleja etykietę/opis stanu zachowania do listy przedmiotów.
 * `stanyList` to rekordy { kod, etykieta, opis }.
 */
export function attachStanyLabels(items, stanyList) {
  const stanyMap = {}
  for (const stan of stanyList || []) {
    stanyMap[stan.kod] = stan
  }

  return (items || []).map((item) => {
    const stanInfo = item.stan_zachowania
      ? stanyMap[item.stan_zachowania]
      : null

    return {
      ...item,
      stan_zachowania_etykieta: stanInfo?.etykieta || null,
      stan_zachowania_opis: stanInfo?.opis || null,
    }
  })
}
