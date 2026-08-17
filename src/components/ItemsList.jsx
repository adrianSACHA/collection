import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteItem } from '../lib/itemsApi'
import ItemForm from './ItemForm'

export default function ItemsList({ filteredItems }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState(null)

  const queryClient = useQueryClient()

  const items = filteredItems || []
  const totalCount = items.length

  const totalValue = items.reduce(
    (sum, item) => sum + (item.wartosc_aktualna || item.cena_zakupu || 0),
    0
  )

  const deleteMutation = useMutation({
    mutationFn: (itemId) => deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setSelectedItem(null)
      setConfirmDelete(false)
    },
    onError: (err) => setActionError(err.message || 'Nie udało się usunąć przedmiotu.'),
  })

  const openItem = (item) => {
    setSelectedItem(item)
    setIsEditing(false)
    setConfirmDelete(false)
    setActionError(null)
  }

  const startEditing = () => {
    setIsEditing(true)
    setActionError(null)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setActionError(null)
  }

  // Wywoływane przez ItemForm po udanym zapisie edycji.
  const handleSaved = (updatedItem) => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
    setSelectedItem(updatedItem)
    setIsEditing(false)
  }

  if (selectedItem) {
    if (isEditing) {
      // Formularz edycji - dokładnie ten sam komponent co przy dodawaniu.
      return (
        <ItemForm
          itemId={selectedItem.id}
          onSaved={handleSaved}
          onCancel={cancelEditing}
        />
      )
    }

    // Widok szczegółów przedmiotu (bez zmian względem wcześniejszej wersji)
    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        <button onClick={() => setSelectedItem(null)} className="text-sm font-medium text-blue-600">
          ← Wróć do listy
        </button>

        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          <DetailRow label="Typ" value={selectedItem.typ} />
          <DetailRow label="Kraj" value={selectedItem.kraj} />
          <DetailRow label="Nominał" value={selectedItem.nominal} />
          <DetailRow label="Rok" value={selectedItem.rok} />
          <DetailRow label="Data wydania" value={selectedItem.data_wydania} />
          <DetailRow label="Miasto wydania" value={selectedItem.miasto_wydania} />
          <DetailRow label="Seria" value={selectedItem.seria} />
          <DetailRow label="Nadruk" value={selectedItem.nadruk} />
          <DetailRow label="Kod drukarni" value={selectedItem.kod_drukarni} />
          <DetailRow label="Znak wodny" value={selectedItem.znak_wodny} />
          <DetailRow
            label="Stan zachowania"
            value={selectedItem.stan_zachowania_etykieta || selectedItem.stan_zachowania}
          />
          <DetailRow label="Wariant" value={selectedItem.wariant} />
          <DetailRow label="Unikat" value={selectedItem.unikat ? 'Tak' : 'Nie'} />
          <DetailRow
            label="Cena zakupu"
            value={selectedItem.cena_zakupu ? `${selectedItem.cena_zakupu} PLN` : null}
          />
          <DetailRow label="Data zakupu" value={selectedItem.data_zakupu} />
          <DetailRow label="Sprzedawca" value={selectedItem.sprzedawca} />
          <DetailRow
            label="Wartość aktualna"
            value={selectedItem.wartosc_aktualna ? `${selectedItem.wartosc_aktualna} PLN` : null}
          />
          <DetailRow label="Lokalizacja" value={selectedItem.lokalizacja} />
          <DetailRow label="Status" value={selectedItem.status} />
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
            className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Edytuj
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex-1 rounded-lg bg-red-50 py-3 font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              Usuń
            </button>
          ) : (
            <button
              onClick={() => deleteMutation.mutate(selectedItem.id)}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-lg bg-red-600 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:bg-gray-300"
            >
              {deleteMutation.isPending ? 'Usuwanie...' : 'Potwierdź usunięcie'}
            </button>
          )}
        </div>

        {confirmDelete && !deleteMutation.isPending && (
          <button onClick={() => setConfirmDelete(false)} className="w-full text-sm text-gray-500">
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
          <h2 className="text-lg font-semibold text-gray-800">Wyniki</h2>
          <span className="text-sm text-gray-500">{totalCount} pozycji</span>
        </div>

        {filteredItems === null ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-gray-500">Użyj filtrów powyżej aby wyświetlić przedmioty.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-gray-500">Brak przedmiotów spełniających kryteria.</p>
          </div>
        ) : (
          <>
            {items.length > 0 && (
              <p className="text-sm text-gray-600">
                Wartość: <span className="font-semibold text-gray-800">{totalValue.toFixed(2)} PLN</span>
              </p>
            )}

            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 overflow-hidden bg-white">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800">
                        {item.kraj} · {item.nominal}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.typ}{item.rok ? ` · ${item.rok}` : ''}
                        {item.stan_zachowania_etykieta && ` · ${item.stan_zachowania_etykieta}`}
                      </p>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      {item.cena_zakupu && (
                        <p className="text-sm font-medium text-gray-700">{item.cena_zakupu} PLN</p>
                      )}
                      {item.wartosc_aktualna && (
                        <p className="text-xs text-gray-500">Obecna: {item.wartosc_aktualna} PLN</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null

  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}