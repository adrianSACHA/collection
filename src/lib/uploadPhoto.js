import { supabase } from './supabase'
import { compressForUpload } from './compressForUpload'

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

  const marker = '/object/public/photos/'
  const index = url.indexOf(marker)

  if (index === -1) return null

  return decodeURIComponent(url.slice(index + marker.length).split('?')[0])
}

/**
 * Wgrywa zdjęcie przedmiotu do Supabase Storage (bucket "photos")
 * i zapisuje odpowiadający wpis w tabeli "item_photos".
 * Zdjęcie jest kompresowane w przeglądarce przed uploadem (patrz compressForUpload.js),
 * żeby nie zapychać limitu storage.
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

  const extension = extensionForType(compressedFile.type)
  const fileName = `${typ}.${extension}`
  const storagePath = `${itemId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('photos')
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
    .from('photos')
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


  return {
    path: storagePath,
    publicUrl,
  }
}


/**
 * Usuwa zdjęcie przedmiotu: fizyczny plik z Supabase Storage (bucket
 * "photos") oraz odpowiadający wpis w tabeli "item_photos".
 * Ścieżkę pliku odczytujemy z zapisanego URL-a, bo rozszerzenie bywa .webp
 * albo .jpg (zależnie od wsparcia WebP w przeglądarce, która robiła upload).
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

  const storagePath = getStoragePathFromUrl(row?.url)

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([storagePath])

    if (storageError) {
      throw new Error(`Błąd usuwania pliku ze storage: ${storageError.message}`)
    }
  }

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
 * Wgrywa oba zdjęcia (awers i rewers) na raz.
 * Zdjęcia są opcjonalne: gdy `photos` jest null albo dana strona nie została
 * wybrana, pomijamy jej upload zamiast rzucać błędem.
 *
 * @param {{ awers?: { file: File } | null, rewers?: { file: File } | null } | null} photos
 * @param {string} itemId
 * @returns {Promise<{ awers: object | null, rewers: object | null }>}
 */
export async function uploadCoinPhotos(photos, itemId) {
  if (!photos) {
    return { awers: null, rewers: null }
  }

  const [awersResult, rewersResult] = await Promise.all([
    photos.awers?.file
      ? uploadPhoto(photos.awers.file, itemId, 'awers')
      : Promise.resolve(null),
    photos.rewers?.file
      ? uploadPhoto(photos.rewers.file, itemId, 'rewers')
      : Promise.resolve(null),
  ])

  return { awers: awersResult, rewers: rewersResult }
}