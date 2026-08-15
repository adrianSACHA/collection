import { supabase } from './supabase'

/**
 * Wgrywa zdjęcie przedmiotu do Supabase Storage (bucket "photos")
 * i zapisuje odpowiadający wpis w tabeli "item_photos".
 *
 * @param {File} file - plik zdjęcia (z inputa/kamery)
 * @param {string} itemId - uuid przedmiotu, do którego należy zdjęcie
 * @param {'awers' | 'rewers'} typ - strona/typ zdjęcia
 * @returns {Promise<{ path: string, publicUrl: string }>}
 */
export async function uploadPhoto(file, itemId, typ) {
  if (!file || !itemId || !typ) {
    throw new Error('uploadPhoto: brak wymaganych parametrów (file, itemId, typ)')
  }

  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${typ}.${fileExt}`
  const storagePath = `${itemId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Błąd uploadu zdjęcia: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(storagePath)

  const publicUrl = urlData.publicUrl

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
 * Wgrywa oba zdjęcia (awers i rewers) na raz.
 *
 * @param {{ awers: { file: File }, rewers: { file: File } }} photos
 * @param {string} itemId
 * @returns {Promise<{ awers: object, rewers: object }>}
 */
export async function uploadCoinPhotos(photos, itemId) {
  const [awersResult, rewersResult] = await Promise.all([
    uploadPhoto(photos.awers.file, itemId, 'awers'),
    uploadPhoto(photos.rewers.file, itemId, 'rewers'),
  ])

  return { awers: awersResult, rewers: rewersResult }
}