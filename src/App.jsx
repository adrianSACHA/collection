import { useState } from 'react'
import ItemForm from './components/ItemForm'
import ItemFilters from './components/ItemFilters'
// import QuickAddForm from './components/QuickAddForm'
import ItemsList from './components/ItemsList'
import AuthGate from './components/AuthGate'
import { supabase } from './lib/supabase'

function App() {
  const [view, setView] = useState('lista')
  const [filterResults, setFilterResults] = useState(null)

  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col lg:flex-row lg:bg-gray-50">
        {/* Mobile navigation: horizontal tabs at top */}
        <div className="lg:hidden flex border-b bg-white">
          <button
            onClick={() => setView('lista')}
            className={`flex-1 py-3 font-medium transition-colors ${view === 'lista'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Kolekcja
          </button>
          <button
            onClick={() => setView('dodaj')}
            className={`flex-1 py-3 font-medium transition-colors ${view === 'dodaj'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Dodaj
          </button>
        </div>

        {/* Desktop sidebar navigation */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white lg:shadow-sm">
          <nav className="space-y-1 p-4">
            <button
              onClick={() => setView('lista')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${view === 'lista'
                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Kolekcja
            </button>
            <button
              onClick={() => setView('dodaj')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${view === 'dodaj'
                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Dodaj
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
          <div className={view === 'lista' ? 'block' : 'hidden'}>
            <div className="space-y-4 p-4 lg:p-6">
              <ItemFilters onResults={setFilterResults} />
              <ItemsList filteredItems={filterResults} />
            </div>
          </div>
          <div className={view === 'dodaj' ? 'block' : 'hidden'}>
            <ItemForm onSaved={() => setView('lista')} />
          </div>
        </div>
      </div>
    </AuthGate>
  )
}

export default App