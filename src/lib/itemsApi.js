import { supabase } from './supabase'

const PAGE_SIZE = 30

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