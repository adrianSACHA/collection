import { supabase } from '../lib/supabase'
import { applyFiltersToQuery, getSortOption } from '../lib/itemFilters'
import { compressForUpload } from '../lib/compressForUpload'

// Deep module: JEDYNE miejsce, które zna tabele/bucket Supabase.
// Komponenty i hooki wołają wyłącznie ten interfejs (seam), dzięki czemu
// budowa zapytań, paginacja, paginacja plików i wgrywanie zdjęć żyją w jednym
// module. Kompresja obrazu zostaje w lib/ - jest czysto przeglądarkowa i nie
// wie nic o Supabase.

const PHOTOS_BUCKET = 'photos'

// Typy zdjęć pozycji - zgodne z item_photos.typ.
const PHOTO_TYPES = ['awers', 'rewers', 'znak_wodny']

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
 *
 * Kolejność jest istotna: gdyby wiersze zniknęły przed plikami, po nieudanym
 * usunięciu Storage nie zostałby już żaden ślad, po którym dałoby się ten plik
 * znaleźć - zostałby sierotą kosztującą miejsce i niewidoczną z aplikacji.
 * Dlatego błąd Storage przerywa całą operację, zamiast być pomijany.
 */
export async function removeItem(itemId) {
  await deletePhotosForItem(itemId)

  const { error: deleteItemError } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)

  if (deleteItemError) throw deleteItemError
}

/* --- Zdjęcia: czytanie --- */

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

/* --- Zdjęcia: Storage --- */

// Rozszerzenie pliku w Storage na podstawie realnego typu MIME.
// Po przejściu na WebP przeglądarka może zwrócić WebP, JPEG albo PNG.
function extensionForType(type) {
  if (type === 'image/webp') return 'webp'
  if (type === 'image/png') return 'png'
  return 'jpg'
}

// Wyciąga ścieżkę pliku w bucketcie "photos" z publicznego URL-a.
// publicUrl: .../storage/v1/object/public/photos/<itemId>/<typ>.<ext>?v=...
function getStoragePathFromUrl(url) {
  if (!url) return null

  const marker = `/object/public/${PHOTOS_BUCKET}/`
  const index = url.indexOf(marker)

  if (index === -1) return null

  return decodeURIComponent(url.slice(index + marker.length).split('?')[0])
}

/**
 * Wgrywa zdjęcie przedmiotu do Storage i zapisuje odpowiadający wpis
 * w `item_photos`. Zdjęcie jest kompresowane w przeglądarce przed uploadem
 * (patrz lib/compressForUpload.js), żeby nie zapychać limitu storage.
 *
 * @param {File} file - plik zdjęcia (z inputa/kamery)
 * @param {string} itemId - uuid przedmiotu, do którego należy zdjęcie
 * @param {'awers' | 'rewers' | 'znak_wodny'} typ - strona/typ zdjęcia
 * @returns {Promise<{ path: string, publicUrl: string }>}
 */
export async function uploadPhoto(file, itemId, typ) {
  if (!file || !itemId || !typ) {
    throw new Error('uploadPhoto: brak wymaganych parametrów (file, itemId, typ)')
  }

  const compressedFile = await compressForUpload(file)

  const storagePath = `${itemId}/${typ}.${extensionForType(compressedFile.type)}`

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(storagePath, compressedFile, {
      cacheControl: '0',
      upsert: true,
      contentType: compressedFile.type,
    })

  if (uploadError) {
    throw new Error(`Błąd uploadu zdjęcia: ${uploadError.message}`)
  }

  // Zapisujemy publiczny URL z parametrem cache-busting (?v=...). Ścieżka pliku
  // jest stała (itemId/typ.<ext>), więc bez tego przeglądarka/CDN pokazywałaby
  // stare zdjęcie po podmianie (ten sam URL = cache).
  const { data: urlData } = supabase.storage
    .from(PHOTOS_BUCKET)
    .getPublicUrl(storagePath)

  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`

  const { data: existing, error: selectError } = await supabase
    .from('item_photos')
    .select('id')
    .eq('item_id', itemId)
    .eq('typ', typ)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Błąd sprawdzania istniejącego zdjęcia: ${selectError.message}`)
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('item_photos')
      .update({ url: publicUrl })
      .eq('id', existing.id)

    if (updateError) {
      throw new Error(`Błąd aktualizacji wpisu zdjęcia: ${updateError.message}`)
    }
  } else {
    const { error: insertError } = await supabase
      .from('item_photos')
      .insert({ item_id: itemId, typ, url: publicUrl })

    if (insertError) {
      throw new Error(`Błąd zapisu wpisu zdjęcia: ${insertError.message}`)
    }
  }

  return { path: storagePath, publicUrl }
}

/**
 * Usuwa zdjęcie jednego typu: fizyczny plik ze Storage oraz wpis
 * w `item_photos`. Ścieżkę pliku odczytujemy z zapisanego URL-a, bo
 * rozszerzenie bywa .webp albo .jpg (zależnie od wsparcia WebP w przeglądarce,
 * która robiła upload).
 *
 * @param {string} itemId - uuid przedmiotu, do którego należy zdjęcie
 * @param {'awers' | 'rewers' | 'znak_wodny'} typ - strona/typ zdjęcia
 * @returns {Promise<void>}
 */
export async function deletePhoto(itemId, typ) {
  if (!itemId || !typ) {
    throw new Error('deletePhoto: brak wymaganych parametrów (itemId, typ)')
  }

  const { data: row, error: selectError } = await supabase
    .from('item_photos')
    .select('url')
    .eq('item_id', itemId)
    .eq('typ', typ)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Błąd odczytu wpisu zdjęcia: ${selectError.message}`)
  }

  await removeStorageFiles([row?.url])

  const { error: deleteError } = await supabase
    .from('item_photos')
    .delete()
    .eq('item_id', itemId)
    .eq('typ', typ)

  if (deleteError) {
    throw new Error(`Błąd usuwania wpisu zdjęcia: ${deleteError.message}`)
  }
}

/**
 * Usuwa wszystkie zdjęcia pozycji (używane przez `removeItem`).
 * Jeden odczyt i jedno usunięcie dla wszystkich typów zamiast pętli po
 * `deletePhoto`, żeby kasowanie pozycji nie mnożyło zapytań.
 */
async function deletePhotosForItem(itemId) {
  const { data: rows, error: selectError } = await supabase
    .from('item_photos')
    .select('url')
    .eq('item_id', itemId)

  if (selectError) {
    throw new Error(`Błąd odczytu zdjęć pozycji: ${selectError.message}`)
  }

  if (!rows || rows.length === 0) return

  await removeStorageFiles(rows.map((row) => row.url))

  const { error: deleteError } = await supabase
    .from('item_photos')
    .delete()
    .eq('item_id', itemId)

  if (deleteError) {
    throw new Error(`Błąd usuwania wpisów zdjęć: ${deleteError.message}`)
  }
}

/**
 * Usuwa pliki ze Storage. Pomija URL-e, z których nie da się odczytać ścieżki
 * (np. wklejone skądś adresy), żeby jeden obcy wpis nie blokował sprzątania.
 */
async function removeStorageFiles(urls) {
  const paths = (urls || []).map(getStoragePathFromUrl).filter(Boolean)

  if (paths.length === 0) return

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove(paths)

  if (error) {
    throw new Error(`Błąd usuwania pliku ze storage: ${error.message}`)
  }
}

/**
 * Wgrywa podane zdjęcia jednej pozycji. Zdjęcia są opcjonalne: brakujące typy
 * (null/undefined) są pomijane, a nie traktowane jako błąd.
 *
 * Jedna wspólna ścieżka uploadu dla pełnego formularza (ItemForm) i szybkiego
 * dodawania (QuickAddForm).
 *
 * @param {Partial<Record<'awers'|'rewers'|'znak_wodny', File | null>>} filesByType
 * @param {string} itemId
 * @returns {Promise<void>}
 */
export async function uploadItemPhotos(filesByType, itemId) {
  await Promise.all(
    PHOTO_TYPES.map((typ) => {
      const file = filesByType?.[typ]

      return file ? uploadPhoto(file, itemId, typ) : null
    })
  )
}
