import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteItem } from '../lib/itemsApi'
import { supabase } from '../lib/supabase'
import LoadingFallback from './LoadingFallback'
import ItemDetail from './items-list/ItemDetail'
import { exportItemsToCsv } from './items-list/exportCsv'

const ItemForm = lazy(() => import('./ItemForm'))

function formatDate(iso) {
  if (!iso) return ''

  const [year, month, day] = iso.split('-')

  if (!year || !month || !day) return iso

  return `${day}.${month}.${year}`
}

// Wszystkie zaznaczone cechy są widoczne w górnym wierszu pozycji.
function getListBadges(item) {
  return [
    item.unc && 'UNC',
    item.unikat && 'Unikat',
    item.bardzo_rzadki && 'Bardzo rzadki',
    item.rzadki && 'Rzadki',
  ].filter(Boolean)
}

// Delikatne różnicowanie kolorów badge'ów na desktopie (bez zmiany danych).
function getBadgeClass(badge) {
  const classes = {
    UNC: 'bg-emerald-50 text-emerald-700',
    Unikat: 'bg-amber-50 text-amber-800',
    'Bardzo rzadki': 'bg-violet-50 text-violet-700',
    Rzadki: 'bg-blue-50 text-blue-700',
  }

  return classes[badge] || 'bg-gray-100 text-gray-600'
}

// Wspólne oznaczenie banknotu dla listy i galerii (jedna funkcja dla obu widoków):
// nadruk -> FZ -> seria -> KN / numer -> gwiazdka -> litera końcowa.
// Bez separatorów; gwiazdki pokazywane wyłącznie przy istniejącym KN.
// Przykłady:
// nadruk="J /", kn_seria="№ 9674538 E" -> "J / № 9674538 E"
// seria=B, kn_seria=16111, gwiazdka_za=true -> "B 16111 ✻"
// kod_drukarni=13, seria=B, kn_seria=123456, gwiazdka_za=true, koncowka_serii=A
//   -> "13 B 123456 ✻ A"
function cleanValue(value) {
  return String(value || '').trim()
}

function formatBanknoteSeries(item) {
  const prefixParts = [
    cleanValue(item.nadruk),
    cleanValue(item.kod_drukarni),
    cleanValue(item.seria),
  ].filter(Boolean)

  const kn = cleanValue(item.kn_seria)
  const numberParts = [
    item.gwiazdka_przed && kn ? '✻' : '',
    kn,
    item.gwiazdka_za && kn ? '✻' : '',
    cleanValue(item.koncowka_serii),
  ].filter(Boolean)

  return [...prefixParts, ...numberParts].join(' ')
}

// Dla banknotów: miasto wydania · emitent (obecnie pole `kraj`).
function formatLocation(item) {
  const parts = [item.miasto_wydania, item.kraj]
    .filter((value) => value?.trim())
    .map((value) => value.trim())

  return parts.join(' · ')
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
  const [thumbnailsRefreshKey, setThumbnailsRefreshKey] = useState(0)

  const queryClient = useQueryClient()
  const items = useMemo(() => filteredItems || [], [filteredItems])
  const totalCount = items.length

  const itemsKey = useMemo(
    () => items.map((item) => item.id).join(','),
    [items]
  )

  useEffect(() => {
    // Gdy lista jest pusta, nie ma czego renderować - pomijamy wczytywanie.
    // Świadomie nie czyścimy tu stanu synchronicznie (reguła
    // react-hooks/set-state-in-effect): miniatury nie są używane, dopóki nie ma
    // pozycji, a kolejne wczytanie i tak nadpisuje całą mapę.
    if (!itemsKey) return

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
        if (!map[row.item_id]) {
          map[row.item_id] = {}
        }

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
        console.error('Błąd wczytywania zdjęć przedmiotu:', error)
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
    onError: (error) => {
      setActionError(error.message || 'Nie udało się usunąć przedmiotu.')
    },
  })

  const openItem = (item) => {
    setSelectedItem(item)
    setSelectedPhotos({})
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
    setThumbnailsRefreshKey((key) => key + 1)
    onModeChange?.(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setActionError(null)
  }

  const backToList = () => {
    setSelectedItem(null)
    setSelectedPhotos({})
    setIsEditing(false)
    onModeChange?.(false)
  }

  const handleSaved = (updatedItem) => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
    setSelectedItem(updatedItem)
    setIsEditing(false)
    setThumbnailsRefreshKey((key) => key + 1)
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
        {filteredItems !== null && items.length > 0 && (
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
                  const banknoteSeries = isCoin
                    ? ''
                    : formatBanknoteSeries(item)
                  const listBadges = getListBadges(item)
                  const location = formatLocation(item)

                  return (
                    <button
                      key={item.id}
                      type="button"
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

                      <div className="flex min-w-0 flex-col gap-1.5 p-2.5">
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

                        {!isCoin && banknoteSeries && (
                          <p
                            title={banknoteSeries}
                            className="truncate text-[10px] font-medium text-gray-600"
                          >
                            {banknoteSeries}
                          </p>
                        )}

                        {location && (
                          <p className="truncate text-xs text-gray-500">
                            {location}
                          </p>
                        )}

                        {listBadges.length > 0 && (
                          <p className="truncate text-xs text-gray-500">
                            {listBadges.join(', ')}
                          </p>
                        )}

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
                  const banknoteSeries = isCoin
                    ? ''
                    : formatBanknoteSeries(item)
                  const listBadges = getListBadges(item)
                  const location = formatLocation(item)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openItem(item)}
                      className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 lg:flex lg:min-h-[108px] lg:items-center lg:px-6 lg:py-4"
                    >
                      <div className="flex items-center gap-3 lg:flex-1">
                        {thumbnails[item.id]?.awers ? (
                          <img
                            src={thumbnails[item.id].awers}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 flex-shrink-0 rounded-lg border border-gray-200 object-contain lg:h-16 lg:w-16"
                          />
                        ) : (
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xl text-gray-300 lg:h-16 lg:w-16 lg:text-2xl">
                            {isCoin ? '🪙' : '💵'}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          {/* Mobile: osobne, krótkie wiersze bez kropek. */}
                          <div className="lg:hidden">
                            <p className="font-semibold text-gray-800">
                              {item.nominal}
                            </p>

                            {isCoin
                              ? item.rok && (
                                  <p className="text-sm text-gray-600">
                                    {item.rok}
                                  </p>
                                )
                              : item.data_wydania && (
                                  <p className="text-sm text-gray-600">
                                    {formatDate(item.data_wydania)}
                                  </p>
                                )}

                            {isCoin && item.naklad && (
                              <p className="text-sm text-gray-500">
                                nakład: {item.naklad}
                              </p>
                            )}

                            {banknoteSeries && (
                              <p
                                title={banknoteSeries}
                                className="truncate text-sm font-medium text-gray-700"
                              >
                                {banknoteSeries}
                              </p>
                            )}

                            {location && (
                              <p className="truncate text-sm text-gray-500">
                                {location}
                              </p>
                            )}

                            {listBadges.length > 0 && (
                              <p className="truncate text-sm text-gray-500">
                                {listBadges.join(', ')}
                              </p>
                            )}
                          </div>

                          {/* Desktop: zwarty układ, maks. jeden separator |. */}
                          <div className="hidden lg:block">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-semibold text-gray-800">
                                {item.nominal}
                              </span>

                              {isCoin
                                ? item.rok && (
                                    <span className="text-gray-500">
                                      {item.rok}
                                    </span>
                                  )
                                : item.data_wydania && (
                                    <span className="font-normal text-gray-500">
                                      {formatDate(item.data_wydania)}
                                    </span>
                                  )}

                              {isCoin && item.naklad && (
                                <span className="text-sm text-gray-500">
                                  nakład: {item.naklad}
                                </span>
                              )}

                              {banknoteSeries && (
                                <>
                                  <span
                                    aria-hidden="true"
                                    className="text-gray-300"
                                  >
                                    |
                                  </span>
                                  <span
                                    title={banknoteSeries}
                                    className="font-medium text-gray-700"
                                  >
                                    {banknoteSeries}
                                  </span>
                                </>
                              )}

                              {listBadges.map((badge) => (
                                <span
                                  key={badge}
                                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBadgeClass(badge)}`}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>

                            {location && (
                              <p
                                title={location}
                                className="mt-1 truncate text-sm text-gray-500"
                              >
                                {location}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-shrink-0 flex-col items-center gap-2 text-right lg:ml-6 lg:w-32 lg:items-end">
                          {item.do_kupienia && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                              Do kupienia
                            </span>
                          )}

                          <div>
                            {item.cena_zakupu && (
                              <p className="whitespace-nowrap text-sm font-semibold text-gray-800">
                                {item.cena_zakupu}
                                {item.cena_zakupu_do
                                  ? `–${item.cena_zakupu_do}`
                                  : ''}{' '}
                                PLN
                              </p>
                            )}

                            {item.wartosc_aktualna && (
                              <p className="whitespace-nowrap text-xs text-gray-500">
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
                className="w-full rounded-lg border border-blue-300 bg-white py-3 font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
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