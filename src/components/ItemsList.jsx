import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ItemsList() {
  const [items, setItems] = useState([])
  const [photosByItem, setPhotosByItem] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterTyp, setFilterTyp] = useState('wszystkie')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError

      const { data: photosData, error: photosError } = await supabase
        .from('item_photos')
        .select('*')

      if (photosError) throw photosError

      const grouped = {}
      for (const photo of photosData) {
        if (!grouped[photo.item_id]) grouped[photo.item_id] = {}
        grouped[photo.item_id][photo.typ] = photo.url
      }

      setItems(itemsData)
      setPhotosByItem(grouped)
    } catch (err) {
      setError(err.message || 'Nie udało się wczytać przedmiotów.')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesTyp = filterTyp === 'wszystkie' || item.typ === filterTyp
    const searchLower = search.trim().toLowerCase()
    const matchesSearch =
      !searchLower ||
      item.kraj?.toLowerCase().includes(searchLower) ||
      item.nominal?.toLowerCase().includes(searchLower) ||
      item.uwagi?.toLowerCase().includes(searchLower)
    return matchesTyp && matchesSearch
  })

  const totalValue = filteredItems.reduce(
    (sum, item) => sum + (item.wartosc_aktualna || item.cena_zakupu || 0),
    0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Wczytywanie kolekcji...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
        <button
          onClick={fetchItems}
          className="mt-3 w-full py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Spróbuj ponownie
        </button>
      </div>
    )
  }

  if (selectedItem) {
    const photos = photosByItem[selectedItem.id] || {}
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <button
          onClick={() => setSelectedItem(null)}
          className="text-blue-600 font-medium text-sm flex items-center gap-1"
        >
          ← Wróć do listy
        </button>

        <div className="grid grid-cols-2 gap-2">
          {photos.awers && (
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img src={photos.awers} alt="Awers" className="w-full h-full object-cover" />
              <p className="text-center text-xs text-gray-500 py-1">Awers</p>
            </div>
          )}
          {photos.rewers && (
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img src={photos.rewers} alt="Rewers" className="w-full h-full object-cover" />
              <p className="text-center text-xs text-gray-500 py-1">Rewers</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
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
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Moja kolekcja</h2>
        <span className="text-sm text-gray-500">{filteredItems.length} pozycji</span>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Szukaj po kraju, nominale, uwagach..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-2">
        {['wszystkie', 'moneta', 'banknot'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterTyp(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
              filterTyp === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filteredItems.length > 0 && (
        <p className="text-sm text-gray-500">
          Wartość: <span className="font-medium text-gray-800">{totalValue.toFixed(2)} PLN</span>
        </p>
      )}

      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Brak przedmiotów do wyświetlenia.</p>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const thumb = photosByItem[item.id]?.awers
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      brak
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {item.kraj} · {item.nominal}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.typ}{item.rok ? ` · ${item.rok}` : ''}
                  </p>
                </div>
                {item.unikat && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex-shrink-0">
                    unikat
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
