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
    value: 'data_desc',
    label: 'Data emisji: najnowsza → najstarsza',
    column: 'data_wydania',
    ascending: false,
  },
  {
    value: 'data_asc',
    label: 'Data emisji: najstarsza → najnowsza',
    column: 'data_wydania',
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
    search: '',
    nominal: '',
    kraj: '',
    dataOd: '',
    dataDo: '',
    typ: fixedType || 'wszystkie',
    znakWodny: '',
    mennica: '',
    material: '',
    sortBy: DEFAULT_SORT,
  }
}

// Kolumny tekstowe przeszukiwane przez globalne pole "Szukaj".
const SEARCH_COLUMNS = [
  'kraj',
  'nominal',
  'mennica',
  'material',
  'uwagi',
  'seria',
  'nadruk',
  'znak_wodny',
  'miasto_wydania',
]

/**
 * Buduje warunek OR dla pola "Szukaj" (PostgREST `.or(...)`).
 * Szuka frazy we wszystkich kolumnach tekstowych, a gdy wpisano
 * samą liczbę - dodatkowo po dokładnym roku. Zwraca null, gdy brak frazy.
 */
export function buildSearchCondition(search) {
  const term = search?.trim()
  if (!term) return null

  const conditions = SEARCH_COLUMNS.map((col) => `${col}.ilike.%${term}%`)

  if (/^\d+$/.test(term)) {
    conditions.push(`rok.eq.${term}`)
  }

  return conditions.join(',')
}

/**
 * Nakłada wartości filtrów na zapytanie Supabase (bez paginacji/sortowania).
 * `filters` to obiekt w formacie z getDefaultFilters.
 */
export function applyFiltersToQuery(query, filters) {
  const searchCondition = buildSearchCondition(filters.search)
  if (searchCondition) {
    query = query.or(searchCondition)
  }

  if (filters.nominal?.trim()) {
    query = query.ilike('nominal', `%${filters.nominal.trim()}%`)
  }

  if (filters.kraj?.trim()) {
    query = query.ilike('kraj', `%${filters.kraj.trim()}%`)
  }

  if (filters.dataOd?.trim()) {
    query = query.gte('data_wydania', filters.dataOd.trim())
  }

  if (filters.dataDo?.trim()) {
    query = query.lte('data_wydania', filters.dataDo.trim())
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
