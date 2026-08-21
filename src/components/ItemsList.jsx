import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteItem } from '../lib/itemsApi'
import { supabase } from '../lib/supabase'
import ItemForm from './ItemForm'

export default function ItemsList({
  filteredItems,
  onModeChange,
  pagination,
  onLoadMore,
}) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [thumbnails, setThumbnails] = useState({})
  const [selectedPhotos, setSelectedPhotos] = useState({})

  const queryClient = useQueryClient()

  const items = filteredItems || []
  const totalCount = items.length

  const totalValue = items.reduce(
    (sum, item) =>
      sum + (item.wartosc_aktualna || item.cena_zakupu || 0),
    0
  )

  useEffect(() => {
    if (!items.length) {
      setThumbnails({})
      return
    }

    async function loadThumbnails() {
      const ids = items.map((item) => item.id)

      const { data, error } = await supabase
        .from('item_photos')
        .select('item_id, url')
        .eq('typ', 'awers')
        .in('item_id', ids)

      if (error) {
        console.error('Błąd wczytywania miniatur:', error)
        return
      }

      const map = {}

      for (const row of data || []) {
        map[row.item_id] = row.url
      }

      setThumbnails(map)
    }

    loadThumbnails()
  }, [items.map((item) => item.id).join(',')])

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
  }

  if (selectedItem) {
    if (isEditing) {
      return (
        <ItemForm
          itemId={selectedItem.id}
          onSaved={handleSaved}
          onCancel={cancelEditing}
        />
      )
    }

    const hasMainPhotos =
      selectedPhotos.awers || selectedPhotos.rewers

    const isCoin = selectedItem.typ === 'moneta'
    const isBanknote = selectedItem.typ === 'banknot'

    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        <button
          onClick={backToList}
          className="text-sm font-medium text-blue-600"
        >
          ← Wróć do listy
        </button>

        {hasMainPhotos && (
          <div className="grid grid-cols-1 gap-2">
            {selectedPhotos.awers && (
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={selectedPhotos.awers}
                  alt="Awers"
                  className="w-full object-contain"
                />
                <p className="py-1 text-center text-xs text-gray-500">
                  Awers
                </p>
              </div>
            )}

            {selectedPhotos.rewers && (
              <div className="overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={selectedPhotos.rewers}
                  alt="Rewers"
                  className="w-full object-contain"
                />
                <p className="py-1 text-center text-xs text-gray-500">
                  Rewers
                </p>
              </div>
            )}
          </div>
        )}

        {selectedPhotos.znak_wodny && (
          <div className="flex items-center gap-2">
            <img
              src={selectedPhotos.znak_wodny}
              alt="Znak wodny"
              className="h-16 w-16 flex-shrink-0 rounded-lg border border-gray-200 bg-gray-100 object-contain"
            />
            <span className="text-xs text-gray-500">
              Znak wodny
            </span>
          </div>
        )}

        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          <DetailRow label="Typ" value={selectedItem.typ} />
          <DetailRow label="Kraj" value={selectedItem.kraj} />
          <DetailRow label="Nominał" value={selectedItem.nominal} />
          <DetailRow label="Rok" value={selectedItem.rok} />
          {isCoin && (
            <DetailRow label="Nakład" value={selectedItem.naklad} />
          )}
          <DetailRow
            label="Data wydania"
            value={selectedItem.data_wydania}
          />
          <DetailRow
            label="Miasto wydania"
            value={selectedItem.miasto_wydania}
          />
          <DetailRow label="Seria" value={selectedItem.seria} />
          <DetailRow label="Nadruk" value={selectedItem.nadruk} />
          <DetailRow
            label="Kod drukarni"
            value={selectedItem.kod_drukarni}
          />
          <DetailRow
            label="Znak wodny (opis)"
            value={selectedItem.znak_wodny}
          />
          <DetailRow
            label="Stan zachowania"
            value={
              selectedItem.stan_zachowania_etykieta ||
              selectedItem.stan_zachowania
            }
          />
          <DetailRow label="Wariant" value={selectedItem.wariant} />
          {isBanknote && (
            <DetailRow
              label="Unikat"
              value={selectedItem.unikat ? 'Tak' : 'Nie'}
            />
          )}
          <DetailRow
            label="Cena zakupu"
            value={
              selectedItem.cena_zakupu
                ? `${selectedItem.cena_zakupu} PLN`
                : null
            }
          />
          <DetailRow
            label="Data zakupu"
            value={selectedItem.data_zakupu}
          />
          <DetailRow
            label="Wartość aktualna"
            value={
              selectedItem.wartosc_aktualna
                ? `${selectedItem.wartosc_aktualna} PLN`
                : null
            }
          />
          <DetailRow
            label="Lokalizacja"
            value={selectedItem.lokalizacja}
          />
          <DetailRow label="Uwagi" value={selectedItem.uwagi} />
        </div>

        {actionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={startEditing}
            className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white"
          >
            Edytuj
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 rounded-lg bg-red-50 py-3 font-medium text-red-600"
            >
              Usuń
            </button>
          ) : (
            <button
              onClick={() =>
                deleteMutation.mutate(selectedItem.id)
              }
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-lg bg-red-600 py-3 font-medium text-white disabled:bg-gray-300"
            >
              {deleteMutation.isPending
                ? 'Usuwanie...'
                : 'Potwierdź usunięcie'}
            </button>
          )}
        </div>

        {confirmDelete && !deleteMutation.isPending && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="w-full text-sm text-gray-500"
          >
            Anuluj usuwanie
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-md space-y-3 lg:max-w-6xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Wyniki
          </h2>

          <span className="text-sm text-gray-500">
            {pagination?.total ?? totalCount} pozycji
          </span>
        </div>

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
            <p className="text-sm text-gray-600">
              Wartość:{' '}
              <span className="font-semibold text-gray-800">
                {totalValue.toFixed(2)} PLN
              </span>
            </p>

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
                      {thumbnails[item.id] && (
                        <img
                          src={thumbnails[item.id]}
                          alt=""
                          className="h-12 w-12 flex-shrink-0 rounded-lg border border-gray-200 object-contain"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800">
                          {item.nominal}
                          {item.rok ? ` · ${item.rok}` : ''}
                          {isCoin && item.naklad
                            ? ` · nakład: ${item.naklad}`
                            : ''}
                        </p>

                        <p className="text-sm text-gray-500">
                          {item.kraj}
                        </p>
                      </div>

                      <div className="ml-4 flex-shrink-0 text-right">
                        {item.cena_zakupu && (
                          <p className="text-sm font-medium text-gray-700">
                            {item.cena_zakupu} PLN
                          </p>
                        )}

                        {item.wartosc_aktualna && (
                          <p className="text-xs text-gray-500">
                            Obecna: {item.wartosc_aktualna} PLN
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

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
          </>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}