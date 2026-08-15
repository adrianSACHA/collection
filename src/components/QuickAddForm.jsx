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

  const toggleClass = (active) =>
    `min-h-[44px] flex-1 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
      active
        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-6 p-4">
      <h2 className="text-xl font-semibold text-gray-800">Dodaj nowy</h2>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Typ *</label>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={typ === 'moneta'}
              aria-label="Wybierz typ monety"
              className={toggleClass(typ === 'moneta')}
              onClick={() => {
                setTyp('moneta')
                clearFeedback()
              }}
            >
              Moneta
            </button>

            <button
              type="button"
              aria-pressed={typ === 'banknot'}
              aria-label="Wybierz typ banknotu"
              className={toggleClass(typ === 'banknot')}
              onClick={() => {
                setTyp('banknot')
                clearFeedback()
              }}
            >
              Banknot
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="kraj" className="mb-1 block text-sm font-medium text-gray-700">
            Kraj <span aria-hidden="true">*</span>
          </label>
          <input
            id="kraj"
            name="kraj"
            type="text"
            value={kraj}
            required
            aria-required="true"
            aria-invalid={Boolean(error && !kraj.trim())}
            aria-describedby={error ? 'form-feedback' : undefined}
            onChange={(e) => {
              setKraj(e.target.value)
              clearFeedback()
            }}
            placeholder="np. Polska"
            className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>

        <div>
          <label htmlFor="nominal" className="mb-1 block text-sm font-medium text-gray-700">
            Nominał <span aria-hidden="true">*</span>
          </label>
          <input
            id="nominal"
            name="nominal"
            type="text"
            value={nominal}
            required
            aria-required="true"
            aria-invalid={Boolean(error && !nominal.trim())}
            aria-describedby={error ? 'form-feedback' : undefined}
            onChange={(e) => {
              setNominal(e.target.value)
              clearFeedback()
            }}
            placeholder="np. 5 zł"
            className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="rok" className="mb-1 block text-sm font-medium text-gray-700">
              Rok
            </label>
            <input
              id="rok"
              type="number"
              value={rok}
              onChange={(e) => setRok(e.target.value)}
              placeholder="np. 1975"
              className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>

          <div className="flex-1">
            <label htmlFor="stan" className="mb-1 block text-sm font-medium text-gray-700">
              Stan
            </label>
            <input
              id="stan"
              type="text"
              value={stan}
              onChange={(e) => setStan(e.target.value)}
              placeholder="np. UNC"
              className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cena-zakupu" className="mb-1 block text-sm font-medium text-gray-700">
            Cena zakupu (PLN)
          </label>
          <input
            id="cena-zakupu"
            type="number"
            step="0.01"
            value={cenaZakupu}
            onChange={(e) => setCenaZakupu(e.target.value)}
            placeholder="np. 25.00"
            className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>

        <div>
          <label htmlFor="uwagi" className="mb-1 block text-sm font-medium text-gray-700">
            Uwagi
          </label>
          <textarea
            id="uwagi"
            value={uwagi}
            onChange={(e) => setUwagi(e.target.value)}
            placeholder="Opcjonalne uwagi o stanie, pochodzeniu itd."
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      >
        {showAdvanced ? '− Ukryj dodatkowe pola' : '+ Pokaż dodatkowe pola'}
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-lg bg-gray-50 p-3">
          <div>
            <label htmlFor="wariant" className="mb-1 block text-sm font-medium text-gray-700">
              Wariant
            </label>
            <input
              id="wariant"
              type="text"
              value={wariant}
              onChange={(e) => setWariant(e.target.value)}
              placeholder="np. odmiana stempla"
              className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={unikat}
              onChange={(e) => setUnikat(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">To unikat</span>
          </label>

          <div>
            <label htmlFor="data-zakupu" className="mb-1 block text-sm font-medium text-gray-700">
              Data zakupu
            </label>
            <input
              id="data-zakupu"
              type="date"
              value={dataZakupu}
              onChange={(e) => setDataZakupu(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>

          <div>
            <label htmlFor="sprzedawca" className="mb-1 block text-sm font-medium text-gray-700">
              Sprzedawca
            </label>
            <input
              id="sprzedawca"
              type="text"
              value={sprzedawca}
              onChange={(e) => setSprzedawca(e.target.value)}
              placeholder="np. nazwa sklepu / użytkownika"
              className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>

          <div>
            <label htmlFor="wartosc-aktualna" className="mb-1 block text-sm font-medium text-gray-700">
              Wartość aktualna (PLN)
            </label>
            <input
              id="wartosc-aktualna"
              type="number"
              step="0.01"
              value={wartoscAktualna}
              onChange={(e) => setWartoscAktualna(e.target.value)}
              placeholder="np. 35.00"
              className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>

          <div>
            <label htmlFor="lokalizacja" className="mb-1 block text-sm font-medium text-gray-700">
              Lokalizacja
            </label>
            <input
              id="lokalizacja"
              type="text"
              value={lokalizacja}
              onChange={(e) => setLokalizacja(e.target.value)}
              placeholder="np. album 2, str. 14"
              className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Zdjęcia *</label>
        <PhotoCapture
          key={photoCaptureKey}
          onPhotosReady={(p) => {
            setPhotos(p)
            clearFeedback()
          }}
        />
      </div>

      <div id="form-feedback" role="alert" aria-live="assertive" className="min-h-[20px]">
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Zapisano pomyślnie!
        </div>
      )}

      <button
        type="submit"
        disabled={!isFormValid || addMutation.isPending}
        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      >
        {addMutation.isPending ? 'Zapisywanie...' : 'Zapisz'}
      </button>
    </form>
  )
}
