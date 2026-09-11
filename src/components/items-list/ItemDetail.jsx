import { useState } from 'react'
import DetailRow from './DetailRow'
import Lightbox from './Lightbox'

export default function ItemDetail({
  item,
  photos = {},
  actionError,
  confirmDelete,
  deletePending,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onConfirmDeleteChange,
}) {
  const [lightbox, setLightbox] = useState(null)

  // photos mogą być jeszcze nie wczytane (null/undefined) - traktujemy jak brak zdjęć.
  const safePhotos = photos || {}
  const hasMainPhotos = safePhotos.awers || safePhotos.rewers
  const isCoin = item.typ === 'moneta'
  const isBanknote = item.typ === 'banknot'

  const formatWithTotal = (value) => {
    if (!value) return null
    const base = `${value} PLN`
    if (item.ilosc > 1) {
      return `${base} (łącznie: ${(value * item.ilosc).toFixed(2)} PLN)`
    }
    return base
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <button
        onClick={onBack}
        className="text-sm font-medium text-blue-600 border border-radius p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
      >
        ← Wróć do listy
      </button>

      {hasMainPhotos && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {safePhotos.awers && (
            <button
              type="button"
              onClick={() => setLightbox({ url: safePhotos.awers, label: 'Awers' })}
              className="overflow-hidden rounded-lg bg-gray-100 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              <img
                src={safePhotos.awers}
                alt="Awers"
                className="w-full cursor-zoom-in object-contain"
              />
              <p className="py-1 text-center text-xs text-gray-500">Awers</p>
            </button>
          )}

          {safePhotos.rewers && (
            <button
              type="button"
              onClick={() => setLightbox({ url: safePhotos.rewers, label: 'Rewers' })}
              className="overflow-hidden rounded-lg bg-gray-100 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              <img
                src={safePhotos.rewers}
                alt="Rewers"
                className="w-full cursor-zoom-in object-contain"
              />
              <p className="py-1 text-center text-xs text-gray-500">Rewers</p>
            </button>
          )}
        </div>
      )}

      {safePhotos.znak_wodny && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setLightbox({ url: safePhotos.znak_wodny, label: 'Znak wodny' })
            }
            className="flex-shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            <img
              src={safePhotos.znak_wodny}
              alt="Znak wodny"
              className="h-16 w-16 cursor-zoom-in rounded-lg border border-gray-200 bg-gray-100 object-contain"
            />
          </button>
          <span className="text-xs text-gray-500">Znak wodny</span>
        </div>
      )}

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        <DetailRow label="Typ" value={item.typ} />
        <DetailRow label="Kraj" value={item.kraj} />
        <DetailRow label="Nominał" value={item.nominal} />
        <DetailRow label="Rok" value={item.rok} />
        {isCoin && <DetailRow label="Nakład" value={item.naklad} />}
        <DetailRow label="Data wydania" value={item.data_wydania} />
        <DetailRow label="Miasto wydania" value={item.miasto_wydania} />
        <DetailRow label="Seria" value={item.seria} />
        <DetailRow label="Nadruk" value={item.nadruk} />
        <DetailRow label="Kod drukarni" value={item.kod_drukarni} />
        <DetailRow label="Znak wodny (opis)" value={item.znak_wodny} />
        <DetailRow
          label="Stan zachowania"
          value={item.stan_zachowania_etykieta || item.stan_zachowania}
        />
        <DetailRow label="Wariant" value={item.wariant} />
        <DetailRow label="Nr katalogowy" value={item.numer_katalogowy} />
        {isCoin && (
          <>
            <DetailRow label="Mennica" value={item.mennica} />
            <DetailRow label="Materiał" value={item.material} />
            <DetailRow label="Waga" value={item.waga_g ? `${item.waga_g} g` : null} />
            <DetailRow
              label="Średnica"
              value={item.srednica_mm ? `${item.srednica_mm} mm` : null}
            />
          </>
        )}
        <DetailRow
          label="Ilość"
          value={item.ilosc ? `${item.ilosc} szt.` : null}
        />
        {isBanknote && (
          <DetailRow label="Unikat" value={item.unikat ? 'Tak' : 'Nie'} />
        )}
        <DetailRow label="Cena zakupu" value={formatWithTotal(item.cena_zakupu)} />
        <DetailRow label="Data zakupu" value={item.data_zakupu} />
        <DetailRow
          label="Wartość aktualna"
          value={formatWithTotal(item.wartosc_aktualna)}
        />
        <DetailRow label="Lokalizacja" value={item.lokalizacja} />
        <DetailRow label="Uwagi" value={item.uwagi} />
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white cursor-pointer"
        >
          Edytuj
        </button>

        <button
          onClick={onDuplicate}
          className="flex-1 rounded-lg bg-white py-3 font-medium text-gray-700 cursor-pointer border border-gray-300 hover:bg-gray-50"
        >
          Duplikuj
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => onConfirmDeleteChange(true)}
            className="flex-1 rounded-lg bg-red-50 py-3 font-medium text-red-600 cursor-pointer border border-red-200 hover:bg-red-100"
          >
            Usuń
          </button>
        ) : (
          <button
            onClick={onDelete}
            disabled={deletePending}
            className="flex-1 rounded-lg bg-red-600 py-3 font-medium text-white disabled:bg-gray-300"
          >
            {deletePending ? 'Usuwanie...' : 'Potwierdź usunięcie'}
          </button>
        )}
      </div>

      {confirmDelete && !deletePending && (
        <button
          onClick={() => onConfirmDeleteChange(false)}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors border-radius p-2 rounded-lg hover:bg-gray-100 cursor-pointer border"
        >
          Anuluj usuwanie
        </button>
      )}

      <Lightbox
        url={lightbox?.url}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </div>
  )
}
