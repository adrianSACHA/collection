import { supabase } from './supabase'
import { applyFiltersToQuery, getSortOption } from './itemFilters'

// Supabase/PostgREST ma domyślny limit 1000 wierszy na zapytanie.
// Dzielimy pobranie na "porcje", aż dostaniemy komplet.
const EXPORT_CHUNK_SIZE = 1000

/**
 * Pobiera CAŁY zbiór spełniający filtry (bez paginacji).
 * Używane przez eksport CSV, żeby obejmować wszystkie rekordy,
 * a nie tylko wczytane strony listy.
 */
export async function fetchAllItemsForExport(filters) {
  const sortOption = getSortOption(filters?.sortBy)

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

  return all
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