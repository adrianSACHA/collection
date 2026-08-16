import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ItemForm({ itemId, onSaved, onCancel }) {
  const isEditMode = !!itemId

  // Form fields
  const [typ_przedmiotu, setTyp_przedmiotu] = useState('moneta')
  const [nominal, setNominal] = useState('')
  const [kraj, setKraj] = useState('')
  const [rok, setRok] = useState('')
  const [data_wydania, setData_wydania] = useState('')
  const [miasto_wydania, setMiasto_wydania] = useState('')
  const [seria, setSeria] = useState('')
  const [stan_zachowania, setStanZachowania] = useState('')
  const [data_zakupu, setData_zakupu] = useState('')
  const [cena_zakupu, setCena_zakupu] = useState('')
  const [sprzedawca, setSprzedawca] = useState('')
  const [notatki, setNotatki] = useState('')

  // State
  const [stanyZachowaniList, setStanyZachowaniList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  // Load stany_zachowania on mount
  useEffect(() => {
    loadStanyZachowania()
  }, [])

  // Load item data if editing
  useEffect(() => {
    if (isEditMode && itemId) {
      loadItem()
    }
  }, [isEditMode, itemId])

  const loadStanyZachowania = async () => {
    try {
      const { data, error: err } = await supabase
        .from('stany_zachowania')
        .select('kod, etykieta')
        .order('kolejnosc', { ascending: true })

      if (err) throw err
      setStanyZachowaniList(data || [])
    } catch (err) {
      console.error('Błąd wczytywania stanów zachowania:', err)
      setError('Nie udało się wczytać stanów zachowania.')
    }
  }

  const loadItem = async () => {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (err) throw err
      if (!data) throw new Error('Przedmiot nie znaleziony.')

      // Populate form
      setTyp_przedmiotu(data.typ_przedmiotu || 'moneta')
      setNominal(data.nominal || '')
      setKraj(data.kraj || '')
      setRok(data.rok ? String(data.rok) : '')
      setData_wydania(data.data_wydania || '')
      setMiasto_wydania(data.miasto_wydania || '')
      setSeria(data.seria || '')
      setStanZachowania(data.stan_zachowania || '')
      setData_zakupu(data.data_zakupu || '')
      setCena_zakupu(data.cena_zakupu ? String(data.cena_zakupu) : '')
      setSprzedawca(data.sprzedawca || '')
      setNotatki(data.notatki || '')
    } catch (err) {
      console.error('Błąd wczytywania przedmiotu:', err)
      setError('Nie udało się wczytać przedmiotu.')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!kraj.trim()) {
      errors.kraj = 'Kraj jest wymagany.'
    }
    if (!nominal.trim()) {
      errors.nominal = 'Nominał jest wymagany.'
    }

    const rokNum = rok ? parseInt(rok, 10) : null
    const hasRok = rokNum !== null && !isNaN(rokNum)
    const hasData = data_wydania.trim() !== ''

    if (!hasRok && !hasData) {
      errors.date_required = 'Podaj przynajmniej rok lub datę wydania.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      // Prepare payload
      let payload = {
        typ_przedmiotu,
        nominal: nominal.trim(),
        kraj: kraj.trim(),
        rok: rok ? parseInt(rok, 10) : null,
        data_wydania: data_wydania || null,
        stan_zachowania: stan_zachowania || null,
        data_zakupu: data_zakupu || null,
        cena_zakupu: cena_zakupu ? parseFloat(cena_zakupu) : null,
        sprzedawca: sprzedawca.trim() || null,
        notatki: notatki.trim() || null,
      }

      // Conditional fields: banknot-specific
      if (typ_przedmiotu === 'banknot') {
        payload.miasto_wydania = miasto_wydania.trim() || null
        payload.seria = seria.trim() || null
      } else {
        // For moneta: explicitly set to null
        payload.miasto_wydania = null
        payload.seria = null
      }

      if (isEditMode) {
        // Update: don't modify user_id
        const { data, error: err } = await supabase
          .from('items')
          .update(payload)
          .eq('id', itemId)
          .select()
          .single()

        if (err) throw err
        setSuccess(true)
        if (onSaved) onSaved(data)
      } else {
        // Insert: add user_id
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        if (userErr) throw userErr
        if (!userData?.user?.id) throw new Error('Nie jesteś zalogowany.')

        payload.user_id = userData.user.id

        const { data, error: err } = await supabase
          .from('items')
          .insert(payload)
          .select()
          .single()

        if (err) throw err
        setSuccess(true)
        resetForm()
        if (onSaved) onSaved(data)
      }
    } catch (err) {
      console.error('Błąd zapisywania przedmiotu:', err)
      // Parse Supabase error messages
      let errorMsg = err.message || 'Nie udało się zapisać przedmiotu.'
      if (errorMsg.includes('check constraint')) {
        errorMsg = 'Podaj przynajmniej rok lub datę wydania.'
      } else if (errorMsg.includes('unique constraint')) {
        errorMsg = 'Ten przedmiot już istnieje.'
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTyp_przedmiotu('moneta')
    setNominal('')
    setKraj('')
    setRok('')
    setData_wydania('')
    setMiasto_wydania('')
    setSeria('')
    setStanZachowania('')
    setData_zakupu('')
    setCena_zakupu('')
    setSprzedawca('')
    setNotatki('')
    setFieldErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen p-4 lg:p-8 lg:bg-gray-50">
      <div className="mx-auto max-w-md lg:max-w-6xl">
        <h2 className="mb-6 text-xl font-semibold text-gray-800">
          {isEditMode ? 'Edytuj przedmiot' : 'Dodaj przedmiot'}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {isEditMode ? 'Przedmiot zaktualizowany!' : 'Przedmiot dodany!'}
          </div>
        )}

        {fieldErrors.date_required && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {fieldErrors.date_required}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Left column: form fields */}
          <div className="space-y-3">
            {/* Typ przedmiotu */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Typ *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTyp_przedmiotu('moneta')}
                  className={`flex-1 min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors lg:min-h-[40px] ${
                    typ_przedmiotu === 'moneta'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Moneta
                </button>
                <button
                  type="button"
                  onClick={() => setTyp_przedmiotu('banknot')}
                  className={`flex-1 min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors lg:min-h-[40px] ${
                    typ_przedmiotu === 'banknot'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Banknot
                </button>
              </div>
            </div>

            {/* Nominal */}
            <div>
              <label htmlFor="nominal" className="mb-1 block text-sm font-medium text-gray-700">
                Nominał <span className="text-red-500">*</span>
              </label>
              <input
                id="nominal"
                type="text"
                value={nominal}
                onChange={(e) => {
                  setNominal(e.target.value)
                  if (fieldErrors.nominal) setFieldErrors({ ...fieldErrors, nominal: '' })
                }}
                placeholder="np. 100 zł"
                className={`w-full min-h-[44px] rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px] ${
                  fieldErrors.nominal ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.nominal && (
                <span className="mt-1 text-xs text-red-600">{fieldErrors.nominal}</span>
              )}
            </div>

            {/* Kraj */}
            <div>
              <label htmlFor="kraj" className="mb-1 block text-sm font-medium text-gray-700">
                Kraj <span className="text-red-500">*</span>
              </label>
              <input
                id="kraj"
                type="text"
                value={kraj}
                onChange={(e) => {
                  setKraj(e.target.value)
                  if (fieldErrors.kraj) setFieldErrors({ ...fieldErrors, kraj: '' })
                }}
                placeholder="np. Polska"
                className={`w-full min-h-[44px] rounded-lg border px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px] ${
                  fieldErrors.kraj ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.kraj && (
                <span className="mt-1 text-xs text-red-600">{fieldErrors.kraj}</span>
              )}
            </div>

            {/* Rok i Data wydania */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="rok" className="mb-1 block text-sm font-medium text-gray-700">
                  Rok
                </label>
                <input
                  id="rok"
                  type="number"
                  value={rok}
                  onChange={(e) => {
                    setRok(e.target.value)
                    if (fieldErrors.date_required) setFieldErrors({ ...fieldErrors, date_required: '' })
                  }}
                  placeholder="np. 2023"
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px]"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="data_wydania" className="mb-1 block text-sm font-medium text-gray-700">
                  Data wydania
                </label>
                <input
                  id="data_wydania"
                  type="date"
                  value={data_wydania}
                  onChange={(e) => {
                    setData_wydania(e.target.value)
                    if (fieldErrors.date_required) setFieldErrors({ ...fieldErrors, date_required: '' })
                  }}
                  title="Format: DD.MM.YYYY"
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px]"
                />
                <span className="mt-1 text-xs text-gray-500">Format: DD.MM.YYYY</span>
              </div>
            </div>

            {/* Stan zachowania */}
            <div>
              <label htmlFor="stan_zachowania" className="mb-1 block text-sm font-medium text-gray-700">
                Stan zachowania
              </label>
              <select
                id="stan_zachowania"
                value={stan_zachowania}
                onChange={(e) => setStanZachowania(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px]"
              >
                <option value="">-- Wybierz --</option>
                {stanyZachowaniList.map((stan) => (
                  <option key={stan.kod} value={stan.kod}>
                    {stan.etykieta}
                  </option>
                ))}
              </select>
            </div>

            {/* Banknot-specific fields */}
            {typ_przedmiotu === 'banknot' && (
              <>
                <div>
                  <label htmlFor="miasto_wydania" className="mb-1 block text-sm font-medium text-gray-700">
                    Miasto wydania
                  </label>
                  <input
                    id="miasto_wydania"
                    type="text"
                    value={miasto_wydania}
                    onChange={(e) => setMiasto_wydania(e.target.value)}
                    placeholder="np. Warszawa"
                    className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px]"
                  />
                </div>

                <div>
                  <label htmlFor="seria" className="mb-1 block text-sm font-medium text-gray-700">
                    Seria
                  </label>
                  <input
                    id="seria"
                    type="text"
                    value={seria}
                    onChange={(e) => setSeria(e.target.value)}
                    placeholder="np. AA 1234567"
                    className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px]"
                  />
                </div>
              </>
            )}

            {/* Transaction fields */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="data_zakupu" className="mb-1 block text-sm font-medium text-gray-700">
                  Data zakupu
                </label>
                <input
                  id="data_zakupu"
                  type="date"
                  value={data_zakupu}
                  onChange={(e) => setData_zakupu(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px]"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="cena_zakupu" className="mb-1 block text-sm font-medium text-gray-700">
                  Cena zakupu (PLN)
                </label>
                <input
                  id="cena_zakupu"
                  type="number"
                  step="0.01"
                  value={cena_zakupu}
                  onChange={(e) => setCena_zakupu(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px]"
                />
              </div>
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
                placeholder="np. allegro, numizmatyk"
                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 lg:min-h-[40px]"
              />
            </div>

            <div>
              <label htmlFor="notatki" className="mb-1 block text-sm font-medium text-gray-700">
                Notatki
              </label>
              <textarea
                id="notatki"
                value={notatki}
                onChange={(e) => setNotatki(e.target.value)}
                placeholder="Dodatkowe informacje..."
                rows="3"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              />
            </div>
          </div>

          {/* Right column: empty on mobile, could add preview/photo section here */}
          <div className="hidden lg:block" />
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            {loading ? 'Zapisywanie...' : isEditMode ? 'Zaktualizuj' : 'Dodaj'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg bg-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-300"
            >
              Anuluj
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
