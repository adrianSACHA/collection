 import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import PhotoCapture from './PhotoCapture'
import FormField from './item-form/FormField'
import { inputClass } from './item-form/formHelpers'
import { uploadCoinPhotos } from '../lib/uploadPhoto'
import { insertItem } from '../lib/itemsApi'
import { useToast } from './toast/toastContext'

export default function QuickAddForm({ onSaved, onCancel, fixedType, onOpenFullForm }) {
  const [typ, setTyp] = useState(fixedType || 'moneta')
  const [kraj, setKraj] = useState('')
  const [nominal, setNominal] = useState('')
  const [rok, setRok] = useState('')
  const [dataWydania, setDataWydania] = useState('')
  const [seria, setSeria] = useState('')
  const [knSeria, setKnSeria] = useState('')
  const [unikat, setUnikat] = useState(false)
  const [unc, setUnc] = useState(false)
  const [bardzoRzadki, setBardzoRzadki] = useState(false)
  const [rzadki, setRzadki] = useState(false)
  const [doKupienia, setDoKupienia] = useState(false)
  const [cenaZakupu, setCenaZakupu] = useState('')
  const [cenaZakupuDo, setCenaZakupuDo] = useState('')
  const [uwagi, setUwagi] = useState('')
  const [photos, setPhotos] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [photoCaptureKey, setPhotoCaptureKey] = useState(0)
  const [savingMode, setSavingMode] = useState(null) // 'default' | 'addAnother'

  const nominalInputRef = useRef(null)
  const toast = useToast()

  useEffect(() => {
    if (!success) return
    const timeout = setTimeout(() => setSuccess(false), 4000)
    return () => clearTimeout(timeout)
  }, [success])

  const resetForm = ({ keepType = false } = {}) => {
    setTyp(keepType ? typ : fixedType || 'moneta')
    setKraj('')
    setNominal('')
    setRok('')
    setDataWydania('')
    setSeria('')
    setKnSeria('')
    setUnikat(false)
    setUnc(false)
    setBardzoRzadki(false)
    setRzadki(false)
    setDoKupienia(false)
    setCenaZakupu('')
    setCenaZakupuDo('')
    setUwagi('')
    setPhotos(null)
    setPhotoCaptureKey((k) => k + 1)
  }

  const addMutation = useMutation({
    mutationFn: async ({ payload, mode }) => {
      const item = await insertItem(payload)
      await uploadCoinPhotos(photos, item.id)
      return { item, mode }
    },
    onSuccess: ({ item, mode }) => {
      setSuccess(true)

      if (mode === 'addAnother') {
        toast.success('Zapisano. Możesz dodać kolejny.')
        resetForm({ keepType: true })
        setTimeout(() => setSuccess(false), 2000)
        nominalInputRef.current?.focus()
      } else {
        toast.success(typ === 'banknot' ? 'Banknot dodany!' : 'Moneta dodana!')
        resetForm()
        if (onSaved) onSaved(item)
      }
    },
    onError: (err) => {
      const message = err.message || 'Wystąpił nieznany błąd podczas zapisu.'
      setError(message)
      toast.error(message)
    },
  })

  // Zdjęcie jest całkowicie opcjonalne - wiele pozycji (np. woreczki obiegowe)
  // nie ma sensownego awersu/rewersu. Wystarczy kraj i nominał.
  const isFormValid = Boolean(kraj.trim() && nominal.trim() && typ)

  const clearFeedback = () => {
    if (success) setSuccess(false)
    if (error) setError(null)
  }

  const handleSubmit = (e, mode = 'default') => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!kraj.trim() || !nominal.trim()) {
      const message =
        typ === 'banknot'
          ? 'Podaj przynajmniej emitenta i nominał.'
          : 'Podaj przynajmniej kraj i nominał.'
      setError(message)
      toast.error(message)
      return
    }
    if (!typ) {
      const message = 'Wybierz typ: moneta lub banknot.'
      setError(message)
      toast.error(message)
      return
    }

    setSavingMode(mode)
    addMutation.mutate({
      mode,
      payload: {
        typ,
        kraj: kraj.trim(),
        nominal: nominal.trim(),
        rok: rok ? parseInt(rok, 10) : null,
        data_wydania: dataWydania || null,
        // Banknot: seria i KN / numer (brak dla monet).
        seria: typ === 'banknot' ? seria.trim() || null : null,
        kn_seria: typ === 'banknot' ? knSeria.trim() || null : null,
        unikat,
        unc,
        bardzo_rzadki: bardzoRzadki,
        rzadki,
        do_kupienia: doKupienia,
        cena_zakupu: cenaZakupu ? parseFloat(cenaZakupu) : null,
        cena_zakupu_do: cenaZakupuDo ? parseFloat(cenaZakupuDo) : null,
        uwagi: uwagi.trim() || null,
      },
    })
  }

  const toggleClass = (active) =>
    `min-h-[44px] flex-1 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px] ${
      active
        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
        : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`

  // Proporcja kadrowania: monety kwadratowe, banknoty 16:9.
  const photoAspect = typ === 'banknot' ? 16 / 9 : 1

  const handlePhotosReady = (p) => {
    setPhotos(p)
    clearFeedback()
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, 'default')} className="min-h-screen p-4 lg:p-8 lg:bg-gray-50">
      <div className="mx-auto max-w-md lg:max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-800">
            {fixedType === 'banknot'
              ? 'Szybko dodaj banknot'
              : fixedType === 'moneta'
                ? 'Szybko dodaj monetę'
                : 'Szybko dodaj'}
          </h2>

          {/* Pełny ItemForm otwiera się DOPIERO tutaj (albo z desktopowego
              przycisku) - nigdy bezpośrednio z AddItemSheet. */}
          {onOpenFullForm && (
            <button
              type="button"
              onClick={onOpenFullForm}
              className="flex-shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              Pełny formularz
            </button>
          )}
        </div>

        {/* Mobile: single column | Desktop: 2 columns */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Lewa kolumna: formularz danych */}
          <div className="space-y-3">
            {/* Typ - chowany, gdy typ narzuca aktywna zakładka */}
            {!fixedType && (
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
            )}

            <FormField label="Nominał" htmlFor="nominal" required>
              <input
                id="nominal"
                name="nominal"
                type="text"
                value={nominal}
                required
                ref={nominalInputRef}
                aria-required="true"
                aria-invalid={Boolean(error && !nominal.trim())}
                aria-describedby={error ? 'form-feedback' : undefined}
                onChange={(e) => {
                  setNominal(e.target.value)
                  clearFeedback()
                }}
                placeholder="np. 5 zł"
                className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
              />
            </FormField>

            <FormField label={typ === 'banknot' ? 'Emitent' : 'Kraj'} htmlFor="kraj" required>
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
                placeholder={typ === 'banknot' ? 'np. Darmstadt' : 'np. Polska'}
                className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
              />
            </FormField>

            {/* Rok (monety) + Data emisji */}
            <div className="flex gap-3">
              {typ === 'moneta' && (
                <FormField label="Rok" htmlFor="rok" className="flex-1">
                  <input
                    id="rok"
                    type="number"
                    value={rok}
                    onChange={(e) => setRok(e.target.value)}
                    placeholder="np. 1975"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>
              )}

              <FormField
                label={typ === 'banknot' ? 'Data emisji' : 'Data wydania'}
                htmlFor="data-wydania"
                className="flex-1"
              >
                <input
                  id="data-wydania"
                  type="date"
                  value={dataWydania}
                  onChange={(e) => setDataWydania(e.target.value)}
                  className={`${inputClass} border-gray-300 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                />
              </FormField>
            </div>

            {/* Banknot: seria oraz KN / numer (opcjonalne). */}
            {typ === 'banknot' && (
              <div className="flex gap-3">
                <FormField label="Seria" htmlFor="seria" className="flex-1">
                  <input
                    id="seria"
                    type="text"
                    value={seria}
                    onChange={(e) => {
                      setSeria(e.target.value)
                      clearFeedback()
                    }}
                    placeholder="np. A"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>

                <FormField label="KN / numer" htmlFor="kn-seria" className="flex-1">
                  <input
                    id="kn-seria"
                    type="text"
                    value={knSeria}
                    onChange={(e) => {
                      setKnSeria(e.target.value)
                      clearFeedback()
                    }}
                    placeholder="np. 123456"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>
              </div>
            )}

            {/* Cechy (flagi) - niezależne checkboxy (moneta) */}
            {typ === 'moneta' && (
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={doKupienia}
                  onChange={(e) => {
                    setDoKupienia(e.target.checked)
                    clearFeedback()
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Do kupienia</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={unc}
                  onChange={(e) => setUnc(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">UNC</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={unikat}
                  onChange={(e) => setUnikat(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Unikat</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={bardzoRzadki}
                  onChange={(e) => setBardzoRzadki(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Bardzo rzadki</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rzadki}
                  onChange={(e) => setRzadki(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Rzadki</span>
              </label>
            </div>
            )}

            {/* Banknot: pojedyncza cena zakupu (opcjonalna). */}
            {typ === 'banknot' && (
              <FormField label="Cena zakupu (PLN)" htmlFor="cena-zakupu">
                <input
                  id="cena-zakupu"
                  type="number"
                  step="0.01"
                  value={cenaZakupu}
                  onChange={(e) => setCenaZakupu(e.target.value)}
                  placeholder="np. 70.00"
                  className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                />
              </FormField>
            )}

            {/* Moneta: cena od-do (opcjonalna). */}
            {typ === 'moneta' && (
              <div className="flex gap-3">
                <FormField label="Cena od (PLN)" htmlFor="cena-zakupu" className="flex-1">
                  <input
                    id="cena-zakupu"
                    type="number"
                    step="0.01"
                    value={cenaZakupu}
                    onChange={(e) => setCenaZakupu(e.target.value)}
                    placeholder="np. 70.00"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>

                <FormField label="Cena do (PLN)" htmlFor="cena-zakupu-do" className="flex-1">
                  <input
                    id="cena-zakupu-do"
                    type="number"
                    step="0.01"
                    value={cenaZakupuDo}
                    onChange={(e) => setCenaZakupuDo(e.target.value)}
                    placeholder="np. 150.00"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>
              </div>
            )}

            {/* Uwagi (moneta) */}
            {typ === 'moneta' && (
              <FormField label="Uwagi" htmlFor="uwagi">
                <textarea
                  id="uwagi"
                  value={uwagi}
                  onChange={(e) => setUwagi(e.target.value)}
                  placeholder="Opcjonalne uwagi o stanie, pochodzeniu itd."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                />
              </FormField>
            )}
          </div>

          {/* Prawa kolumna: na desktopie trzyma pola zaawansowane mogłyby być tu;
              zdjęcia renderujemy raz, poniżej siatki. */}
        </div>

        {/* Zdjęcia (opcjonalne) - jedna instancja, responsywna */}
        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Zdjęcia (opcjonalne)
          </label>
          <PhotoCapture
            key={photoCaptureKey}
            aspect={photoAspect}
            onPhotosReady={handlePhotosReady}
          />
        </div>

        {/* Feedback i przyciski */}
        <div className="mt-6 flex flex-col gap-3 lg:col-span-2">
          {error && (
            <div id="form-feedback" role="alert" aria-live="assertive" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Zapisano pomyślnie!
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={!isFormValid || addMutation.isPending}
              className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              {addMutation.isPending && savingMode === 'default'
                ? 'Zapisywanie...'
                : 'Zapisz'}
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'addAnother')}
              disabled={!isFormValid || addMutation.isPending}
              className="flex-1 rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              {addMutation.isPending && savingMode === 'addAnother'
                ? 'Zapisywanie...'
                : 'Zapisz i dodaj kolejny'}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={addMutation.isPending}
                className="flex-1 rounded-lg bg-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:bg-gray-100"
              >
                Anuluj
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
