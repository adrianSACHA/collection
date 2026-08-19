import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'


export default function ItemFilters({ onResults, onLoading, fixedType }) {
  // Filter fields
  const [nominal, setNominal] = useState('')
  const [kraj, setKraj] = useState('')
  const [rok, setRok] = useState('')
  const [miasto_wydania, setMiasto_wydania] = useState('')
  const [typ, setTyp] = useState(fixedType || 'wszystkie')
  const [stan_zachowania, setStanZachowania] = useState('')


  // State
  const [stanyZachowaniList, setStanyZachowaniList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false) // Mobile toggle


  // Load stany_zachowania on mount
  useEffect(() => {
    loadStanyZachowania()
  }, [])


  // Jeśli fixedType się zmienia (np. przełączenie zakładki Monety/Banknoty
  // w App.jsx), wymuszamy typ filtra i przeładowujemy wyniki.
  useEffect(() => {
    if (fixedType) setTyp(fixedType)
    handleFilter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedType])


  const loadStanyZachowania = async () => {
    try {
      const { data, error: err } = await supabase
        .from('stany_zachowania')
        .select('kod, etykieta, opis')
        .order('kolejnosc', { ascending: true })


      if (err) throw err
      setStanyZachowaniList(data || [])
    } catch (err) {
      console.error('Błąd wczytywania stanów zachowania:', err)
      setError('Nie udało się wczytać stanów zachowania.')
    }
  }


  // Dołącza etykietę i opis stanu zachowania do każdego przedmiotu,
  // po stronie JS - zastępuje dawny JOIN robiony przez widok
  // items_z_etykietami (usunięty, żeby nie trzymać dwóch źródeł danych
  // o tych samych przedmiotach).
  const attachStanyLabels = (items, stanyList) => {
    const stanyMap = {}
    for (const stan of stanyList) stanyMap[stan.kod] = stan

    return items.map((item) => {
      const stanInfo = item.stan_zachowania ? stanyMap[item.stan_zachowania] : null
      return {
        ...item,
        stan_zachowania_etykieta: stanInfo?.etykieta || null,
        stan_zachowania_opis: stanInfo?.opis || null,
      }
    })
  }

  const handleFilter = async () => {
    try {
      setLoading(true)
      setError(null)
      if (onLoading) onLoading(true)


      let query = supabase
        .from('items')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })


      const effectiveTyp = fixedType || typ

      // Apply filters (all optional, AND logic)
      if (nominal.trim()) {
        query = query.ilike('nominal', `%${nominal.trim()}%`)
      }
      if (kraj.trim()) {
        query = query.ilike('kraj', `%${kraj.trim()}%`)
      }
      if (rok.trim()) {
        const rokNum = parseInt(rok, 10)
        if (!isNaN(rokNum)) {
          query = query.eq('rok', rokNum)
        }
      }
      if (miasto_wydania.trim()) {
        query = query.ilike('miasto_wydania', `%${miasto_wydania.trim()}%`)
      }
      if (effectiveTyp !== 'wszystkie') {
        query = query.eq('typ', effectiveTyp)
      }
      if (stan_zachowania.trim()) {
        query = query.eq('stan_zachowania', stan_zachowania)
      }


      const { data, error: err } = await query


      if (err) throw err

      // Jeśli lista stanów zachowania jeszcze się nie wczytała (rzadki
      // wyścig przy pierwszym renderze), dociągamy ją tutaj, żeby
      // etykiety zawsze się poprawnie dołączyły.
      const stanyList = stanyZachowaniList.length
        ? stanyZachowaniList
        : (await supabase.from('stany_zachowania').select('kod, etykieta, opis')).data || []

      const withLabels = attachStanyLabels(data || [], stanyList)
      if (onResults) onResults(withLabels)
    } catch (err) {
      console.error('Błąd filtrowania:', err)
      setError('Nie udało się wczytać wyników.')
      if (onResults) onResults(null)
    } finally {
      setLoading(false)
      if (onLoading) onLoading(false)
    }
  }


  const handleClear = () => {
    setNominal('')
    setKraj('')
    setRok('')
    setMiasto_wydania('')
    setTyp(fixedType || 'wszystkie')
    setStanZachowania('')
    setError(null)
    handleFilter()
  }


  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4 lg:p-6">
      {/* Header */}
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Filtry</h3>


      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* Always visible on mobile: Nominał & Kraj */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Nominał */}
        <div>
          <label htmlFor="filter-nominal" className="mb-1 block text-sm font-medium text-gray-700">
            Nominał
          </label>
          <input
            id="filter-nominal"
            type="text"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            placeholder="np. 100 zł"
            className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>


        {/* Kraj */}
        <div>
          <label htmlFor="filter-kraj" className="mb-1 block text-sm font-medium text-gray-700">
            Kraj
          </label>
          <input
            id="filter-kraj"
            type="text"
            value={kraj}
            onChange={(e) => setKraj(e.target.value)}
            placeholder="np. Polska"
            className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          />
        </div>
      </div>


      {/* Mobile toggle for additional filters */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="lg:hidden mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {isExpanded ? '▼ Schowaj pozostałe' : '▶ Rozwiń pozostałe filtry'}
      </button>


      {/* Additional filters - hidden on mobile unless expanded, always visible on desktop */}
      <div className={`${isExpanded ? 'block' : 'hidden'} lg:block mt-4`}>
        <div className={`grid gap-4 sm:grid-cols-2 ${fixedType ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
          {/* Rok */}
          <div>
            <label htmlFor="filter-rok" className="mb-1 block text-sm font-medium text-gray-700">
              Rok
            </label>
            <input
              id="filter-rok"
              type="number"
              value={rok}
              onChange={(e) => setRok(e.target.value)}
              placeholder="np. 2023"
              className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>


          {/* Miasto wydania */}
          <div>
            <label htmlFor="filter-miasto" className="mb-1 block text-sm font-medium text-gray-700">
              Miasto wydania
            </label>
            <input
              id="filter-miasto"
              type="text"
              value={miasto_wydania}
              onChange={(e) => setMiasto_wydania(e.target.value)}
              placeholder="np. Warszawa"
              className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            />
          </div>


          {/* Typ przedmiotu - chowany, gdy typ jest już wybrany przez zakładkę */}
          {!fixedType && (
            <div>
              <label htmlFor="filter-typ" className="mb-1 block text-sm font-medium text-gray-700">
                Typ
              </label>
              <select
                id="filter-typ"
                value={typ}
                onChange={(e) => setTyp(e.target.value)}
                className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              >
                <option value="wszystkie">-- Wszystkie --</option>
                <option value="moneta">Moneta</option>
                <option value="banknot">Banknot</option>
              </select>
            </div>
          )}


          {/* Stan zachowania */}
          <div>
            <label htmlFor="filter-stan" className="mb-1 block text-sm font-medium text-gray-700">
              Stan zachowania
            </label>
            <select
              id="filter-stan"
              value={stan_zachowania}
              onChange={(e) => setStanZachowania(e.target.value)}
              className="w-full min-h-[40px] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              <option value="">-- Wszystkie --</option>
              {stanyZachowaniList.map((stan) => (
                <option key={stan.kod} value={stan.kod}>
                  {stan.etykieta}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleFilter}
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        >
          {loading ? 'Filtrowanie...' : 'Filtruj'}
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          className="flex-1 rounded-lg bg-gray-200 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-300"
        >
          Wyczyść
        </button>
      </div>
    </div>
  )
}