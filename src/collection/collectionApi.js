import { supabase } from '../lib/supabase'
import { applyFiltersToQuery, getSortOption } from '../lib/itemFilters'
import { getStoragePathFromUrl } from '../lib/uploadPhoto'

// Deep module: JEDYNE miejsce, które zna tabele/bucket Supabase.
// Komponenty i hooki wołają wyłącznie ten interfejs (seam), dzięki czemu
// budowa zapytań, paginacja i ścieżki storage żyją w jednym module.

// Supabase/PostgREST ma domyślny limit 1000 wierszy na zapytanie -
// eksport dzielimy na porcje, aż dostaniemy komplet.
const EXPORT_CHUNK_SIZE = 1000

/* --- Items: czytanie --- */

function buildItemsQuery(filters, { start, end, withCount = false } = {}) {
  const sort = getSortOption(filters?.sortBy)

  let query = supabase
    .from('items')
    .select('*', withCount ? { count: 'exact' } : undefined)
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })

  if (typeof start === 'number' && typeof end === 'number') {
    query = query.range(start, end)
  }

  return applyFiltersToQuery(query, filters)
}

/**
 * Jedna strona listy + łączna liczba rekordów spełniających filtry.
 * @returns {Promise<{ rows: object[], total: number }>}
 */
export async function listItems(filters, { page = 0, pageSize } = {}) {
  const start = page * pageSize

  const { data, error, count } = await buildItemsQuery(filters, {
    start,
    end: start + pageSize - 1,
    withCount: true,
  })

  if (error) throw error

  return { rows: data || [], total: count || 0 }
}

/**
 * CAŁY zbiór spełniający filtry (bez paginacji) - do eksportu CSV.
 * Pobieramy porcjami, bo PostgREST ma limit 1000 wierszy na zapytanie.
 */
export async function listAllItems(filters) {
  const all = []
  let offset = 0

  for (;;) {
    const { data, error } = await buildItemsQuery(filters, {
      start: offset,
      end: offset + EXPORT_CHUNK_SIZE - 1,
    })

    if (error) throw error

    const rows = data || []
    all.push(...rows)

    if (rows.length < EXPORT_CHUNK_SIZE) break

    offset += EXPORT_CHUNK_SIZE
  }

  return all
}

/**
 * Liczniki pozycji per typ (do badge'ów nawigacji). Błąd nie jest rzucany -
 * wtedy zwracamy `null`, żeby UI nie pokazywał pustego miejsca na licznik.
 */
export async function countByType() {
  const [banknotRes, monetaRes] = await Promise.all([
    supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('typ', 'banknot'),
    supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('typ', 'moneta'),
  ])

  return {
    banknot: typeof banknotRes.count === 'number' ? banknotRes.count : null,
    moneta: typeof monetaRes.count === 'number' ? monetaRes.count : null,
  }
}

/**
 * Unikalne wartości słownikowe do filtrów (mennica, materiał).
 */
export async function listFacets() {
  const { data, error } = await supabase
    .from('items')
    .select('mennica, material')

  if (error) throw error

  const mennice = new Set()
  const materialy = new Set()

  for (const row of data || []) {
    if (row.mennica?.trim()) mennice.add(row.mennica.trim())
    if (row.material?.trim()) materialy.add(row.material.trim())
  }

  return {
    mennica: Array.from(mennice).sort(),
    material: Array.from(materialy).sort(),
  }
}

/* --- Items: zapis --- */

export async function getItem(itemId) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error) throw error
  return data
}

export async function createItem(payload) {
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

export async function updateItem(itemId, payload) {
  const { data, error } = await supabase
    .from('items')
    .update(payload)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Usuwa przedmiot wraz ze zdjęciami: najpierw pliki ze Storage, potem wpisy
 * w `item_photos`, na końcu rekord w `items`.
 */
export async function removeItem(itemId) {
  const { data: photos, error: photosSelectError } = await supabase
    .from('item_photos')
    .select('url')
    .eq('item_id', itemId)

  if (photosSelectError) throw photosSelectError

  const paths = (photos || [])
    .map((photo) => getStoragePathFromUrl(photo.url))
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

/* --- Zdjęcia: czytanie --- */

const PHOTO_TYPES = ['awers', 'rewers', 'znak_wodny']

/**
 * Wiersze zdjęć dla wielu pozycji (miniatury listy).
 * @returns {Promise<Array<{ item_id: string, typ: string, url: string }>>}
 */
export async function listPhotosByItemTyp(itemIds) {
  if (!itemIds || itemIds.length === 0) return []

  const { data, error } = await supabase
    .from('item_photos')
    .select('item_id, typ, url')
    .in('typ', PHOTO_TYPES)
    .in('item_id', itemIds)

  if (error) throw error
  return data || []
}

/**
 * Wiersze zdjęć jednej pozycji (widok szczegółów / edycja).
 * @returns {Promise<Array<{ typ: string, url: string }>>}
 */
export async function listPhotosForItem(itemId) {
  const { data, error } = await supabase
    .from('item_photos')
    .select('typ, url')
    .eq('item_id', itemId)

  if (error) throw error
  return data || []
}
