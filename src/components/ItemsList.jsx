import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteItem } from '../lib/itemsApi'
import { supabase } from '../lib/supabase'
import LoadingFallback from './LoadingFallback'
import ItemDetail from './items-list/ItemDetail'
import { exportItemsToCsv } from './items-list/exportCsv'

const ItemForm = lazy(() => import('./ItemForm'))

// Formatuje datę ISO (YYYY-MM-DD) na DD.MM.RRRR.
function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

// Zaznaczone flagi jako tablica (brak = pusto).
function getFlags(item) {
  return [
    item.unc && 'UNC',
    item.unikat && 'Unikat',
    item.bardzo_rzadki && 'Bardzo rzadki',
    item.rzadki && 'Rzadki',
  ].filter(Boolean)
}

export default function ItemsList({
  filteredItems,
  onModeChange,
  pagination,
    onLoadMore,
  viewMode = 'lista',
}) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [duplicateItem, setDuplicateItem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState(null)
        const [thumbnails, setThumbnails] = useState({})
  const [selectedPhotos, setSelectedPhotos] = useState({})
  // Licznik wymuszający ponowne pobranie miniatur po zapisie (edycja/dodanie).
  const [thumbnailsRefreshKey, setThumbnailsRefreshKey] = useState(0)

  const queryClient = useQueryClient()

    const items = useMemo(() => filteredItems || [], [filteredItems])
    const totalCount = items.length

    const itemsKey = useMemo(
    () => items.map((item) => item.id).join(','),
    [items]
  )

    useEffect(() => {
    if (!itemsKey) {
      return
    }

    const ids = itemsKey.split(',')

    async function loadThumbnails() {
      const { data, error } = await supabase
        .from('item_photos')
        .select('item_id, typ, url')
        .in('typ', ['awers', 'rewers'])
        .in('item_id', ids)

      if (error) {
        console.error('Błąd wczytywania miniatur:', error)
        return
      }

      const map = {}

      for (const row of data || []) {
        if (!map[row.item_id]) map[row.item_id] = {}
        map[row.item_id][row.typ] = row.url
      }

      setThumbnails(map)
      }

      loadThumbnails()
  }, [itemsKey, thumbnailsRefreshKey])

  useEffect(() => {
    if (!selectedItem || isEditing) return

    async function loadSelectedPhotos() {
      const { data, error } = await supabase
        .from('item_photos')
        .select('typ, url')
        .eq('item_id', selectedItem.id)

      if (error) {
        console.error(
          'Błąd wczytywania zdjęć przedmiotu:',
          error
        )
        return
      }

      const map = {}

      for (const row of data || []) {
        map[row.typ] = row.url
      }

      setSelectedPhotos(map)
    }

    loadSelectedPhotos()
  }, [selectedItem, isEditing])

  const deleteMutation = useMutation({
    mutationFn: (itemId) => deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setSelectedItem(null)
      setConfirmDelete(false)
      onModeChange?.(false)
    },
    onError: (err) =>
      setActionError(
        err.message || 'Nie udało się usunąć przedmiotu.'
      ),
  })

  const openItem = (item) => {
    setSelectedItem(item)
    setIsEditing(false)
    setConfirmDelete(false)
    setActionError(null)
    onModeChange?.(true)
  }

    const startEditing = () => {
    setIsEditing(true)
    setActionError(null)
  }

  const startDuplicate = () => {
    setDuplicateItem(selectedItem)
    setActionError(null)
  }

  const cancelDuplicate = () => {
    setDuplicateItem(null)
  }

    const handleDuplicated = () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
    setDuplicateItem(null)
    setSelectedItem(null)
    setThumbnailsRefreshKey((k) => k + 1)
    onModeChange?.(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setActionError(null)
  }

  const backToList = () => {
    setSelectedItem(null)
    setIsEditing(false)
    onModeChange?.(false)
  }

    const handleSaved = (updatedItem) => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
    setSelectedItem(updatedItem)
    setIsEditing(false)
    setThumbnailsRefreshKey((k) => k + 1)
  }

    if (duplicateItem) {
    return (
      <Suspense fallback={<LoadingFallback label="Wczytywanie formularza…" />}>
        <ItemForm
          duplicateFrom={duplicateItem}
          onSaved={handleDuplicated}
          onCancel={cancelDuplicate}
        />
      </Suspense>
    )
  }

  if (selectedItem) {
    if (isEditing) {
      return (
        <Suspense fallback={<LoadingFallback label="Wczytywanie formularza…" />}>
          <ItemForm
            itemId={selectedItem.id}
            onSaved={handleSaved}
            onCancel={cancelEditing}
          />
        </Suspense>
      )
    }

        return (
      <ItemDetail
        item={selectedItem}
        photos={selectedPhotos}
        actionError={actionError}
        confirmDelete={confirmDelete}
        deletePending={deleteMutation.isPending}
        onBack={backToList}
        onEdit={startEditing}
        onDuplicate={startDuplicate}
        onDelete={() => deleteMutation.mutate(selectedItem.id)}
        onConfirmDeleteChange={setConfirmDelete}
      />
    )
  }

  return (
    <div className="w-full">
            <div className="mx-auto max-w-md space-y-3 lg:max-w-6xl">
                {(filteredItems !== null && items.length > 0) && (
                  <div className="flex items-center justify-end">
                    <span className="text-sm text-gray-500">
                      {pagination?.total ?? totalCount} pozycji
                    </span>
                  </div>
                )}

        {filteredItems === null ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-gray-500">
              Użyj filtrów powyżej aby wyświetlić przedmioty.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-gray-500">
              Brak przedmiotów spełniających kryteria.
            </p>
          </div>
                ) : (
                    <>
            {viewMode === 'galeria' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((item) => {
                  const isCoin = item.typ === 'moneta'

                  return (
                    <button
                      key={item.id}
                      onClick={() => openItem(item)}
                      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                    >
                                                                                        <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-gray-100 p-2 lg:h-48">
                        {(() => {
                          const photos = thumbnails[item.id] || {}
                          const hasAny = photos.awers || photos.rewers

                          if (!hasAny) {
                            return (
                              <div className="flex h-full w-full items-center justify-center text-3xl text-gray-300">
                                {isCoin ? '🪙' : '💵'}
                              </div>
                            )
                          }

                          // Zdjęcia ograniczone do rozmiaru kafelka (max-h-full /
                          // max-w-full), żeby nigdy nie rozpychały grida.
                          return (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                              {photos.awers && (
                                <img
                                  src={photos.awers}
                                  alt=""
                                  loading="lazy"
                                  className="min-h-0 max-h-full min-w-0 max-w-full flex-1 object-contain transition-transform group-hover:scale-105"
                                />
                              )}
                              {photos.rewers && (
                                <img
                                  src={photos.rewers}
                                  alt=""
                                  loading="lazy"
                                  className="min-h-0 max-h-full min-w-0 max-w-full flex-1 object-contain transition-transform group-hover:scale-105"
                                />
                              )}
                            </div>
                          )
                        })()}

                        {item.unikat && (
                          <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                            Unikat
                          </span>
                        )}

                        {item.do_kupienia && (
                          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Do kupienia
                          </span>
                        )}
                      </div>

                                                                                        <div className="flex flex-col gap-0.5 p-2.5">
                        <p className="truncate font-medium text-gray-800">
                          {item.nominal}
                          {isCoin
                            ? item.rok
                              ? ` · ${item.rok}`
                              : ''
                            : item.data_wydania
                              ? ` · ${formatDate(item.data_wydania)}`
                              : ''}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {item.kraj}
                          {getFlags(item).length > 0
                            ? ` · ${getFlags(item).join(', ')}`
                            : ''}
                        </p>
                        {(item.cena_zakupu || item.wartosc_aktualna) && (
                          <p className="mt-auto text-xs font-medium text-gray-700">
                            {item.cena_zakupu || item.wartosc_aktualna} PLN
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {items.map((item) => {
                  const isCoin = item.typ === 'moneta'

                  return (
                    <button
                      key={item.id}
                      onClick={() => openItem(item)}
                      className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                                            <div className="flex items-center gap-3">
                        {thumbnails[item.id]?.awers ? (
                          <img
                            src={thumbnails[item.id].awers}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 flex-shrink-0 rounded-lg border border-gray-200 object-contain"
                          />
                        ) : (
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xl text-gray-300">
                            {isCoin ? '🪙' : '💵'}
                          </div>
                        )}

                                                <div className="min-w-0 flex-1">
                                                  <p className="font-medium text-gray-800">
                                                    {item.nominal}
                                                    {isCoin
                                                      ? item.rok
                                                        ? ` · ${item.rok}`
                                                        : ''
                                                      : item.data_wydania
                                                        ? ` · ${formatDate(item.data_wydania)}`
                                                        : ''}
                                                    {isCoin && item.naklad
                                                      ? ` · nakład: ${item.naklad}`
                                                      : ''}
                                                  </p>

                                                  <p className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                                    <span className="truncate">{item.kraj}</span>
                                                    {getFlags(item).map((flag) => (
                                                      <span
                                                        key={flag}
                                                        className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                                                      >
                                                        {flag}
                                                      </span>
                                                    ))}
                                                  </p>
                                                </div>

                                                <div className="ml-4 flex flex-shrink-0 items-center gap-2 text-right">
                                                  {item.do_kupienia && (
                                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                                      Do kupienia
                                                    </span>
                                                  )}

                                                  <div>
                                                    {item.cena_zakupu && (
                                                      <p className="text-sm font-medium text-gray-700">
                                                        {item.cena_zakupu}
                                                        {item.cena_zakupu_do ? `–${item.cena_zakupu_do}` : ''} PLN
                                                      </p>
                                                    )}

                                                    {item.wartosc_aktualna && (
                                                      <p className="text-xs text-gray-500">
                                                        Obecna: {item.wartosc_aktualna} PLN
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

                        {pagination?.total > 0 && (
              <p className="text-center text-sm text-gray-500">
                Wyświetlono {items.length} z {pagination.total} pozycji
              </p>
            )}

            {pagination?.hasMore && (
              <button
                type="button"
               onClick={onLoadMore}
                className="w-full rounded-lg border border-blue-300 bg-white py-3 font-medium text-blue-600 hover:bg-blue-50"
              >
                Pokaż kolejne 20
              </button>
            )}

                        <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => exportItemsToCsv(items, { scope: 'widoczne' })}
                className="text-sm font-medium text-gray-500 underline transition-colors hover:text-gray-700"
              >
                ⬇ Eksportuj wczytane pozycje ({items.length}) do CSV
              </button>
            </div>
          </>
        )}
            </div>
    </div>
  )
}