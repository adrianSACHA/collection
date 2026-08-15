import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PhotoCapture from './PhotoCapture'
import { uploadCoinPhotos } from '../lib/uploadPhoto'
import { insertItem } from '../lib/itemsApi'

export default function QuickAddForm({ onSaved }) {
  const [typ, setTyp] = useState('moneta')
  const [kraj, setKraj] = useState('')
  const [nominal, setNominal] = useState('')
  const [rok, setRok] = useState('')
  const [stan, setStan] = useState('')
  const [wariant, setWariant] = useState('')
  const [unikat, setUnikat] = useState(false)
  const [cenaZakupu, setCenaZakupu] = useState('')
  const [dataZakupu, setDataZakupu] = useState('')
  const [sprzedawca, setSprzedawca] = useState('')
  const [wartoscAktualna, setWartoscAktualna] = useState('')
  const [lokalizacja, setLokalizacja] = useState('')
  const [uwagi, setUwagi] = useState('')
  const [photos, setPhotos] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [photoCaptureKey, setPhotoCaptureKey] = useState(0)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!success) return
    const timeout = setTimeout(() => setSuccess(false), 4000)
    return () => clearTimeout(timeout)
  }, [success])

  const resetForm = () => {
    setTyp('moneta')
    setKraj('')
    setNominal('')
    setRok('')
    setStan('')
    setWariant('')
    setUnikat(false)
    setCenaZakupu('')
    setDataZakupu('')
    setSprzedawca('')
    setWartoscAktualna('')
    setLokalizacja('')
    setUwagi('')
    setPhotos(null)
    setPhotoCaptureKey((k) => k + 1)
  }

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const item = await insertItem(payload)
      await uploadCoinPhotos(photos, item.id)
      return item
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setSuccess(true)
      resetForm()
      if (onSaved) onSaved(item)
    },
    onError: (err) => setError(err.message || 'Wystąpił nieznany błąd podczas zapisu.'),
  })

  const isFormValid = kraj.trim() && nominal.trim() && typ && photos

  const clearFeedback = () => {
    if (success) setSuccess(false)
    if (error) setError(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!kraj.trim() || !nominal.trim()) {
      setError('Podaj przynajmniej kraj i nominał.')
      return
    }
    if (!typ) {
      setError('Wybierz typ: moneta lub banknot.')
      return
    }
    if (!photos) {
      setError('Zrób zdjęcia awersu i rewersu przed zapisem.')
      return
    }

    addMutation.mutate({
      typ,
      kraj: kraj.trim(),
      nominal: nominal.trim(),
      rok: rok ? parseInt(rok, 10) : null,
      stan: stan.trim() || null,
      wariant: wariant.trim() || null,
      unikat,
      cena_zakupu: cenaZakupu ? parseFloat(cenaZakupu) : null,
      data_zakupu: dataZakupu || null,
      sprzedawca: sprzedawca.trim() || null,
      wartosc_aktualna: wartoscAktualna ? parseFloat(wartoscAktualna) : null,
      lokalizacja: lokalizacja.trim() || null,
      uwagi: uwagi.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold text-gray-800">Dodaj nowy</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Typ *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setTyp('moneta'); clearFeedback() }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                typ === 'moneta'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Moneta
            </button>
            <button
              type="button"
              onClick={() => { setTyp('banknot'); clearFeedback() }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                typ === 'banknot'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Banknot
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kraj *
          </label>
          <input
            type="text"
            value={kraj}
            onChange={(e) => { setKraj(e.target.value); clearFeedback() }}
            placeholder="np. Polska"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nominał *
          </label>
          <input
            type="text"
            value={nominal}
            onChange={(e) => { setNominal(e.target.value); clearFeedback() }}
            placeholder="np. 5 zł"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rok
            </label>
            <input
              type="number"
              value={rok}
              onChange={(e) => setRok(e.target.value)}
              placeholder="np. 1975"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stan
            </label>
            <input
              type="text"
              value={stan}
              onChange={(e) => setStan(e.target.value)}
              placeholder="np. UNC"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cena zakupu (PLN)
          </label>
          <input
            type="number"
            step="0.01"
            value={cenaZakupu}
            onChange={(e) => setCenaZakupu(e.target.value)}
            placeholder="np. 25.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Uwagi
          </label>
          <textarea
            value={uwagi}
            onChange={(e) => setUwagi(e.target.value)}
            placeholder="Opcjonalne uwagi o stanie, pochodzeniu itd."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-sm text-blue-600 font-medium py-2 hover:text-blue-700"
      >
        {showAdvanced ? '− Ukryj dodatkowe pola' : '+ Pokaż dodatkowe pola'}
      </button>

      {showAdvanced && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wariant
            </label>
            <input
              type="text"
              value={wariant}
              onChange={(e) => setWariant(e.target.value)}
              placeholder="np. odmiana stempla"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={unikat}
              onChange={(e) => setUnikat(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">To unikat</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data zakupu
            </label>
            <input
              type="date"
              value={dataZakupu}
              onChange={(e) => setDataZakupu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sprzedawca
            </label>
            <input
              type="text"
              value={sprzedawca}
              onChange={(e) => setSprzedawca(e.target.value)}
              placeholder="np. nazwa sklepu / użytkownika"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wartość aktualna (PLN)
            </label>
            <input
              type="number"
              step="0.01"
              value={wartoscAktualna}
              onChange={(e) => setWartoscAktualna(e.target.value)}
              placeholder="np. 35.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lokalizacja
            </label>
            <input
              type="text"
              value={lokalizacja}
              onChange={(e) => setLokalizacja(e.target.value)}
              placeholder="np. album 2, str. 14"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zdjęcia *
        </label>
        <PhotoCapture key={photoCaptureKey} onPhotosReady={(p) => { setPhotos(p); clearFeedback() }} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          Zapisano pomyślnie!
        </div>
      )}

      <button
        type="submit"
        disabled={!isFormValid || addMutation.isPending}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {addMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
      </button>
    </form>
  )
}