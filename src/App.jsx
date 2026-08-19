import { useState } from 'react'
import ItemForm from './components/ItemForm'
import ItemFilters from './components/ItemFilters'
import ItemsList from './components/ItemsList'
import AuthGate from './components/AuthGate'
import { supabase } from './lib/supabase'

const VIEW_STORAGE_KEY = 'kolekcja_widok_typ'

function getInitialView() {
  if (typeof window === 'undefined') return 'moneta'
  const saved = window.localStorage.getItem(VIEW_STORAGE_KEY)
  return saved === 'moneta' || saved === 'banknot' ? saved : 'moneta'
}

function App() {
  const [view, setView] = useState(getInitialView) // 'moneta' | 'banknot'
  const [mode, setMode] = useState('lista') // 'lista' | 'dodaj'
  const [filterResults, setFilterResults] = useState(null)
  const [isDetailView, setIsDetailView] = useState(false)

  const switchType = (nextType) => {
    setView(nextType)
    window.localStorage.setItem(VIEW_STORAGE_KEY, nextType)
    setMode('lista')
    setFilterResults(null)
    setIsDetailView(false)
  }

  const goToAdd = () => setMode('dodaj')

  const backToListAfterSave = () => {
    setMode('lista')
  }

  const typLabel = view === 'moneta' ? 'monetę' : 'banknot'

  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col lg:flex-row lg:bg-gray-50">
        {/* Mobile navigation: sticky horizontal tabs at top */}
        <div className="lg:hidden sticky top-0 z-10 flex border-b bg-white shadow-sm">
          <button
            onClick={() => switchType('moneta')}
            className={`flex-1 py-3 font-medium transition-colors ${view === 'moneta'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Monety
          </button>
          <button
            onClick={() => switchType('banknot')}
            className={`flex-1 py-3 font-medium transition-colors ${view === 'banknot'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Banknoty
          </button>
        </div>

        {/* Desktop sidebar navigation */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white lg:shadow-sm">
          <nav className="space-y-1 p-4">
            <button
              onClick={() => switchType('moneta')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${view === 'moneta'
                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Monety
            </button>
            <button
              onClick={() => switchType('banknot')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${view === 'banknot'
                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Banknoty
            </button>
          </nav>

          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-auto mx-4 mb-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            Wyloguj
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 lg:overflow-auto">
          {mode === 'lista' ? (
            <div className="space-y-4 p-4 lg:p-6">
              {!isDetailView && (
                <>
                  <ItemFilters fixedType={view} onResults={setFilterResults} />
                  <div className="mx-auto max-w-md lg:max-w-6xl">
                    <button
                      onClick={goToAdd}
                      className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-100"
                    >
                      + Dodaj {typLabel}
                    </button>
                  </div>
                </>
              )}
              <ItemsList
                filteredItems={filterResults}
                onModeChange={setIsDetailView}
              />
            </div>
          ) : (
            <ItemForm
              fixedType={view}
              onSaved={backToListAfterSave}
              onCancel={backToListAfterSave}
            />
          )}
        </div>
      </div>
    </AuthGate>
  )
}

export default App