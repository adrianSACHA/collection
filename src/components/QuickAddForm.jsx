import { useState } from 'react'
import PhotoCapture from './PhotoCapture'
import { uploadCoinPhotos } from '../lib/uploadPhoto'
import { supabase } from '../lib/supabase'

export default function QuickAddForm({ onSaved }) {
  const [kraj, setKraj] = useState('')
  const [nominal, setNominal] = useState('')
  const [rok, setRok] = useState('')
  const [typ, setTyp] = useState('')
  const [stan, setStan] = useState('')
  const [cenaZakupu, setCenaZakupu] = useState('')
  const [uwagi, setUwagi] = useState('')
  const [photos, setPhotos] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setKraj('')
    setNominal('')
    setRok('')
    setTyp('')
    setStan('')
    setCenaZakupu('')
    setUwagi('')
    setPhotos(null)
  }

  const isFormValid = kraj.trim() && nominal.trim() && photos

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!kraj.trim() || !nominal.trim()) {
      setError('Podaj przynajmniej kraj i nominał.')
      return
    }
    if (!photos) {
      setError('Zrób zdjęcia awersu i rewersu przed zapisem.')
      return
    }

    setSaving(true)
    try {
      const { data: item, error: insertError } = await supabase
        .from('items')
        .insert({
          kraj: kraj.trim(),
          nominal: nominal.trim(),
          rok: rok ? parseInt(rok, 10) : null,
          typ: typ.trim() || null,
          stan: stan.trim() || null,
          cena_zakupu: cenaZakupu ? parseFloat(cenaZakupu) : null,
          uwagi: uwagi.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      await uploadCoinPhotos(photos, item.id)

      setSuccess(true)
      resetForm()
      if (onSaved) onSaved(item)
    } catch (err) {
      setError(err.message || 'Wystąpił nieznany błąd podczas zapisu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold text-gray-800">Dodaj monetę</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kraj *
          </label>
          <input
            type="text"
            value={kraj}
            onChange={(e) => setKraj(e.target.value)}
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
            onChange={(e) => setNominal(e.target.value)}
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
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typ
            </label>
            <input
              type="text"
              value={typ}
              onChange={(e) => setTyp(e.target.value)}
              placeholder="np. moneta"
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zdjęcia *
        </label>
        <PhotoCapture onPhotosReady={setPhotos} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          Moneta zapisana pomyślnie!
        </div>
      )}

      <button
        type="submit"
        disabled={!isFormValid || saving}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Zapisywanie...' : 'Zapisz monetę'}
      </button>
    </form>
  )
}