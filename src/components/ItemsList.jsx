import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateItem, deleteItem } from '../lib/itemsApi'

export default function ItemsList({ filteredItems }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState(null)

  const queryClient = useQueryClient()

  // Use filteredItems if provided, otherwise show empty
  const items = filteredItems || []
  const photosByItem = {} // Not used in filtered view
  const totalCount = items.length

  const totalValue = items.reduce(
    (sum, item) => sum + (item.wartosc_aktualna || item.cena_zakupu || 0),
    0
  )

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateItem(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setSelectedItem(updated)
      setIsEditing(false)
      setEditForm(null)
    },
    onError: (err) => setActionError(err.message || 'Nie udało się zapisać zmian.'),
  })

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
    setEditForm({
      typ: selectedItem.typ || 'moneta',
      kraj: selectedItem.kraj || '',
      nominal: selectedItem.nominal || '',
      rok: selectedItem.rok ?? '',
      stan: selectedItem.stan || '',
      wariant: selectedItem.wariant || '',
      unikat: selectedItem.unikat || false,
      cena_zakupu: selectedItem.cena_zakupu ?? '',
      data_zakupu: selectedItem.data_zakupu || '',
      sprzedawca: selectedItem.sprzedawca || '',
      wartosc_aktualna: selectedItem.wartosc_aktualna ?? '',
      lokalizacja: selectedItem.lokalizacja || '',
      status: selectedItem.status || '',
      uwagi: selectedItem.uwagi || '',
    })
    setIsEditing(true)
    setActionError(null)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm(null)
    setActionError(null)
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const saveEdit = () => {
    if (!editForm.kraj.trim() || !editForm.nominal.trim()) {
      setActionError('Kraj i nominał są wymagane.')
      return
    }

    setActionError(null)
    updateMutation.mutate({
      id: selectedItem.id,
      payload: {
        typ: editForm.typ,
        kraj: editForm.kraj.trim(),
        nominal: editForm.nominal.trim(),
        rok: editForm.rok ? parseInt(editForm.rok, 10) : null,
        stan: editForm.stan.trim() || null,
        wariant: editForm.wariant.trim() || null,
        unikat: editForm.unikat,
        cena_zakupu: editForm.cena_zakupu ? parseFloat(editForm.cena_zakupu) : null,
        data_zakupu: editForm.data_zakupu || null,
        sprzedawca: editForm.sprzedawca.trim() || null,
        wartosc_aktualna: editForm.wartosc_aktualna ? parseFloat(editForm.wartosc_aktualna) : null,
        lokalizacja: editForm.lokalizacja.trim() || null,
        status: editForm.status.trim() || null,
        uwagi: editForm.uwagi.trim() || null,
      },
    })
  }

  if (selectedItem) {
    const photos = {} // Not used in filtered view

    if (isEditing) {
      return (
        <div className="mx-auto max-w-md space-y-4 p-4">
          <button onClick={cancelEditing} className="text-sm font-medium text-gray-500">
            Anuluj
          </button>

          <h2 className="text-xl font-semibold text-gray-800">Edytuj</h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleEditChange('typ', 'moneta')}
                className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
                  editForm.typ === 'moneta' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Moneta
              </button>
              <button
                type="button"
                onClick={() => handleEditChange('typ', 'banknot')}
                className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
                  editForm.typ === 'banknot' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Banknot
              </button>
            </div>

            <EditField label="Kraj *" value={editForm.kraj} onChange={(v) => handleEditChange('kraj', v)} />
            <EditField label="Nominał *" value={editForm.nominal} onChange={(v) => handleEditChange('nominal', v)} />

            <div className="flex gap-3">
              <EditField label="Rok" type="number" value={editForm.rok} onChange={(v) => handleEditChange('rok', v)} />
              <EditField label="Stan" value={editForm.stan} onChange={(v) => handleEditChange('stan', v)} />
            </div>

            <EditField label="Wariant" value={editForm.wariant} onChange={(v) => handleEditChange('wariant', v)} />

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.unikat}
                onChange={(e) => handleEditChange('unikat', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">To unikat</span>
            </label>

            <div className="flex gap-3">
              <EditField label="Cena zakupu" type="number" value={editForm.cena_zakupu} onChange={(v) => handleEditChange('cena_zakupu', v)} />
              <EditField label="Data zakupu" type="date" value={editForm.data_zakupu} onChange={(v) => handleEditChange('data_zakupu', v)} />
            </div>

            <EditField label="Sprzedawca" value={editForm.sprzedawca} onChange={(v) => handleEditChange('sprzedawca', v)} />
            <EditField label="Wartość aktualna" type="number" value={editForm.wartosc_aktualna} onChange={(v) => handleEditChange('wartosc_aktualna', v)} />
            <EditField label="Lokalizacja" value={editForm.lokalizacja} onChange={(v) => handleEditChange('lokalizacja', v)} />
            <EditField label="Status" value={editForm.status} onChange={(v) => handleEditChange('status', v)} />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Uwagi</label>
              <textarea
                value={editForm.uwagi}
                onChange={(e) => handleEditChange('uwagi', e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              />
            </div>
          </div>

          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          <button
            onClick={saveEdit}
            disabled={updateMutation.isPending}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
          >
            {updateMutation.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-md space-y-4 p-4">
        <button onClick={() => setSelectedItem(null)} className="text-sm font-medium text-blue-600">
          ← Wróć do listy
        </button>

        <div className="grid grid-cols-2 gap-2">
          {photos.awers && (
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img src={photos.awers} alt="Awers" className="h-full w-full object-cover" />
              <p className="py-1 text-center text-xs text-gray-500">Awers</p>
            </div>
          )}
          {photos.rewers && (
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img src={photos.rewers} alt="Rewers" className="h-full w-full object-cover" />
              <p className="py-1 text-center text-xs text-gray-500">Rewers</p>
            </div>
          )}
        </div>

        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          <DetailRow label="Typ" value={selectedItem.typ} />
          <DetailRow label="Kraj" value={selectedItem.kraj} />
          <DetailRow label="Nominał" value={selectedItem.nominal} />
          <DetailRow label="Rok" value={selectedItem.rok} />
          <DetailRow label="Stan" value={selectedItem.stan} />
          <DetailRow label="Wariant" value={selectedItem.wariant} />
          <DetailRow label="Unikat" value={selectedItem.unikat ? 'Tak' : 'Nie'} />
          <DetailRow label="Cena zakupu" value={selectedItem.cena_zakupu ? `${selectedItem.cena_zakupu} PLN` : null} />
          <DetailRow label="Data zakupu" value={selectedItem.data_zakupu} />
          <DetailRow label="Sprzedawca" value={selectedItem.sprzedawca} />
          <DetailRow label="Wartość aktualna" value={selectedItem.wartosc_aktualna ? `${selectedItem.wartosc_aktualna} PLN` : null} />
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
                        {item.typ_przedmiotu || item.typ}{item.rok ? ` · ${item.rok}` : ''}
                        {item.stan_zachowania && ` · ${item.etykieta || item.stan_zachowania}`}
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

function EditField({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex-1">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      />
    </div>
  )
}
