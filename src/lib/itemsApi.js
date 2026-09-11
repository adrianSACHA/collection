import { supabase } from './supabase'
import {
  applyFiltersToQuery,
  getSortOption,
  attachStanyLabels,
} from './itemFilters'

const PAGE_SIZE = 30

// Supabase/PostgREST ma domyślny limit 1000 wierszy na zapytanie.
// Dzielimy pobranie na "porcje", aż dostaniemy komplet.
const EXPORT_CHUNK_SIZE = 1000

/**
  * Pobiera CAŁY zbiór spełniający filtry (bez paginacji), z etykietami stanów
 * zachowania. Używane przez eksport CSV, żeby obejmować wszystkie rekordy,
 * a nie tylko wczytane strony listy.
 */
export async function fetchAllItemsForExport(filters) {
  const sortOption = getSortOption(filters?.sortBy)

  // Słownik stanów zachowania - potrzebny do zmapowania etykiet w CSV.
  const { data: stanyData, error: stanyError } = await supabase
    .from('stany_zachowania')
    .select('kod, etykieta, opis')

  if (stanyError) throw stanyError

  const all = []
  let offset = 0

    // Pętla z porcjami, aż pobierzemy mniej niż pełną porcję (komplet danych).
  while (true) {
    let query = supabase
      .from('items')
      .select('*')
      .order(sortOption.column, {
        ascending: sortOption.ascending,
        nullsFirst: false,
      })
      .range(offset, offset + EXPORT_CHUNK_SIZE - 1)

    query = applyFiltersToQuery(query, filters)

    const { data, error } = await query
    if (error) throw error

    const rows = data || []
    all.push(...rows)

    if (rows.length < EXPORT_CHUNK_SIZE) break
    offset += EXPORT_CHUNK_SIZE
  }

  return attachStanyLabels(all, stanyData)
}

/**
 * Pobiera jedną "stronę" przedmiotów wraz z ich zdjęciami.
 * Używane przez useInfiniteQuery.
 */
export async function fetchItemsPage({ pageParam = 0, filterTyp = 'wszystkie', search = '' }) {
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('items')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filterTyp !== 'wszystkie') {
    query = query.eq('typ', filterTyp)
  }

  const term = search.trim()
  if (term) {
    const isNumeric = /^\d+$/.test(term)
        const conditions = [
      `kraj.ilike.%${term}%`,
      `nominal.ilike.%${term}%`,
      `numer_katalogowy.ilike.%${term}%`,
      `mennica.ilike.%${term}%`,
      `material.ilike.%${term}%`,
      `uwagi.ilike.%${term}%`,
    ]
    if (isNumeric) {
      conditions.push(`rok.eq.${term}`)
    }
    query = query.or(conditions.join(','))
  }

  const { data: items, error, count } = await query
  if (error) throw error

  const itemIds = items.map((i) => i.id)
  let photosByItem = {}

  if (itemIds.length > 0) {
    const { data: photos, error: photosError } = await supabase
      .from('item_photos')
      .select('*')
      .in('item_id', itemIds)

    if (photosError) throw photosError

    photosByItem = photos.reduce((acc, p) => {
      if (!acc[p.item_id]) acc[p.item_id] = {}
      acc[p.item_id][p.typ] = p.url
      return acc
    }, {})
  }

  const hasMore = to + 1 < count

  return {
    items,
    photosByItem,
    nextPage: hasMore ? pageParam + 1 : undefined,
    totalCount: count,
  }
}

export async function insertItem(payload) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData?.user) throw new Error('Nie jesteś zalogowany.')

  const { data, error } = await supabase
    .from('items')
    .insert({ ...payload, user_id: userData.user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateItem(id, payload) {
  const { data, error } = await supabase
    .from('items')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteItem(itemId) {
  const { data: photos, error: photosSelectError } = await supabase
    .from('item_photos')
    .select('url')
    .eq('item_id', itemId)

  if (photosSelectError) throw photosSelectError

  const marker = '/object/public/photos/'
  const paths = photos
    .map((p) => {
      const idx = p.url.indexOf(marker)
      return idx >= 0 ? p.url.slice(idx + marker.length) : null
    })
    .filter(Boolean)

  if (paths.length > 0) {
    await supabase.storage.from('photos').remove(paths)
  }

  const { error: deletePhotosError } = await supabase
    .from('item_photos')
    .delete()
    .eq('item_id', itemId)

  if (deletePhotosError) throw deletePhotosError

  const { error: deleteItemError } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)

  if (deleteItemError) throw deleteItemError
}