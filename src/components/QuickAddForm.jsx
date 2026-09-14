import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PhotoCapture from './PhotoCapture'
import FormField from './item-form/FormField'
import { inputClass } from './item-form/formHelpers'
import { uploadCoinPhotos } from '../lib/uploadPhoto'
import { insertItem } from '../lib/itemsApi'

export default function QuickAddForm({ onSaved, onCancel, fixedType }) {
  const [typ, setTyp] = useState(fixedType || 'moneta')
  const [kraj, setKraj] = useState('')
  const [nominal, setNominal] = useState('')
  const [rok, setRok] = useState('')
  const [dataWydania, setDataWydania] = useState('')
  const [wariant, setWariant] = useState('')
  const [ilosc, setIlosc] = useState('1')
  const [mennica, setMennica] = useState('')
  const [material, setMaterial] = useState('')
  const [wagaG, setWagaG] = useState('')
  const [srednicaMm, setSrednicaMm] = useState('')
  const [unikat, setUnikat] = useState(false)
  const [unc, setUnc] = useState(false)
  const [bardzoRzadki, setBardzoRzadki] = useState(false)
  const [rzadki, setRzadki] = useState(false)
  const [doKupienia, setDoKupienia] = useState(false)
  const [cenaZakupu, setCenaZakupu] = useState('')
  const [cenaZakupuDo, setCenaZakupuDo] = useState('')
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
  const [savingMode, setSavingMode] = useState(null) // 'default' | 'addAnother'

  const nominalInputRef = useRef(null)

  const queryClient = useQueryClient()

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
    setWariant('')
    setIlosc('1')
    setMennica('')
    setMaterial('')
    setWagaG('')
    setSrednicaMm('')
    setUnikat(false)
    setUnc(false)
    setBardzoRzadki(false)
    setRzadki(false)
    setDoKupienia(false)
    setCenaZakupu('')
    setCenaZakupuDo('')
    setDataZakupu('')
    setSprzedawca('')
    setWartoscAktualna('')
    setLokalizacja('')
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
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setSuccess(true)

      if (mode === 'addAnother') {
        resetForm({ keepType: true })
        setTimeout(() => setSuccess(false), 2000)
        nominalInputRef.current?.focus()
      } else {
        resetForm()
        if (onSaved) onSaved(item)
      }
    },
    onError: (err) => setError(err.message || 'Wystąpił nieznany błąd podczas zapisu.'),
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
      setError('Podaj przynajmniej kraj i nominał.')
      return
    }
    if (!typ) {
      setError('Wybierz typ: moneta lub banknot.')
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
        wariant: wariant.trim() || null,
        ilosc: ilosc ? parseInt(ilosc, 10) : 1,
        mennica: mennica.trim() || null,
        material: material.trim() || null,
        waga_g: wagaG ? parseFloat(wagaG) : null,
        srednica_mm: srednicaMm ? parseFloat(srednicaMm) : null,
        unikat,
        unc,
        bardzo_rzadki: bardzoRzadki,
        rzadki,
        do_kupienia: doKupienia,
        cena_zakupu: cenaZakupu ? parseFloat(cenaZakupu) : null,
        cena_zakupu_do: cenaZakupuDo ? parseFloat(cenaZakupuDo) : null,
        data_zakupu: dataZakupu || null,
        sprzedawca: sprzedawca.trim() || null,
        wartosc_aktualna: wartoscAktualna ? parseFloat(wartoscAktualna) : null,
        lokalizacja: lokalizacja.trim() || null,
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
        <h2 className="mb-6 text-xl font-semibold text-gray-800">
          {fixedType === 'banknot'
            ? 'Szybko dodaj banknot'
            : fixedType === 'moneta'
              ? 'Szybko dodaj monetę'
              : 'Szybko dodaj'}
        </h2>

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
                placeholder={typ === 'banknot' ? 'np. Narodowy Bank Polski' : 'np. Polska'}
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

            {/* Cechy (flagi) - niezależne checkboxy */}
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

            {/* Cena od-do */}
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

            {/* Przycisk dla pól zaawansowanych */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              {showAdvanced ? '− Ukryj dodatkowe pola' : '+ Pokaż dodatkowe pola'}
            </button>

            {/* Pola zaawansowane */}
            {showAdvanced && (
              <div className="space-y-3 rounded-lg bg-gray-100 p-3 lg:bg-white">
                <FormField label="Wariant" htmlFor="wariant">
                  <input
                    id="wariant"
                    type="text"
                    value={wariant}
                    onChange={(e) => setWariant(e.target.value)}
                    placeholder="np. odmiana stempla"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>

                <FormField label="Ilość" htmlFor="ilosc">
                  <input
                    id="ilosc"
                    type="number"
                    min="1"
                    value={ilosc}
                    onChange={(e) => setIlosc(e.target.value)}
                    placeholder="1"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>

                {typ === 'moneta' && (
                  <>
                    <div className="flex gap-3">
                      <FormField label="Mennica" htmlFor="mennica" className="flex-1">
                        <input
                          id="mennica"
                          type="text"
                          value={mennica}
                          onChange={(e) => setMennica(e.target.value)}
                          placeholder="np. Warszawa (MW)"
                          className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                        />
                      </FormField>

                      <FormField label="Materiał / stop" htmlFor="material" className="flex-1">
                        <input
                          id="material"
                          type="text"
                          value={material}
                          onChange={(e) => setMaterial(e.target.value)}
                          placeholder="np. Cu-Ni, Ag 925"
                          className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                        />
                      </FormField>
                    </div>

                    <div className="flex gap-3">
                      <FormField label="Waga (g)" htmlFor="waga" className="flex-1">
                        <input
                          id="waga"
                          type="number"
                          step="0.01"
                          value={wagaG}
                          onChange={(e) => setWagaG(e.target.value)}
                          placeholder="np. 5.00"
                          className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                        />
                      </FormField>

                      <FormField label="Średnica (mm)" htmlFor="srednica" className="flex-1">
                        <input
                          id="srednica"
                          type="number"
                          step="0.01"
                          value={srednicaMm}
                          onChange={(e) => setSrednicaMm(e.target.value)}
                          placeholder="np. 24.00"
                          className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                        />
                      </FormField>
                    </div>
                  </>
                )}

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={unikat}
                    onChange={(e) => setUnikat(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">To unikat</span>
                </label>

                <FormField label="Data zakupu" htmlFor="data-zakupu">
                  <input
                    id="data-zakupu"
                    type="date"
                    value={dataZakupu}
                    onChange={(e) => setDataZakupu(e.target.value)}
                    className={`${inputClass} border-gray-300 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>

                <FormField label="Sprzedawca" htmlFor="sprzedawca">
                  <input
                    id="sprzedawca"
                    type="text"
                    value={sprzedawca}
                    onChange={(e) => setSprzedawca(e.target.value)}
                    placeholder="np. nazwa sklepu / użytkownika"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>

                <FormField label="Wartość aktualna (PLN)" htmlFor="wartosc-aktualna">
                  <input
                    id="wartosc-aktualna"
                    type="number"
                    step="0.01"
                    value={wartoscAktualna}
                    onChange={(e) => setWartoscAktualna(e.target.value)}
                    placeholder="np. 35.00"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>

                <FormField label="Lokalizacja" htmlFor="lokalizacja">
                  <input
                    id="lokalizacja"
                    type="text"
                    value={lokalizacja}
                    onChange={(e) => setLokalizacja(e.target.value)}
                    placeholder="np. album 2, str. 14"
                    className={`${inputClass} border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300`}
                  />
                </FormField>
              </div>
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
