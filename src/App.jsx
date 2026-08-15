import { useState } from 'react'
import QuickAddForm from './components/QuickAddForm'
import ItemsList from './components/ItemsList'

function App() {
  const [view, setView] = useState('lista')

  return (
    <div>
      <div className="flex border-b">
        <button
          onClick={() => setView('lista')}
          className={`flex-1 py-3 font-medium ${view === 'lista' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Kolekcja
        </button>
        <button
          onClick={() => setView('dodaj')}
          className={`flex-1 py-3 font-medium ${view === 'dodaj' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Dodaj
        </button>
      </div>

      <div className={view === 'lista' ? 'block' : 'hidden'}>
        <ItemsList />
      </div>
      <div className={view === 'dodaj' ? 'block' : 'hidden'}>
        <QuickAddForm onSaved={() => setView('lista')} />
      </div>
    </div>
  )
}

export default App