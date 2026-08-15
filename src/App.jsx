import { useState } from 'react'
import QuickAddForm from './components/QuickAddForm'
import ItemsList from './components/ItemsList'

function App() {
  const [view, setView] = useState('lista')

  return (
    <div>
      <div className="flex border-b">
        <button onClick={() => setView('lista')} className={view === 'lista' ? 'font-bold' : ''}>
          Kolekcja
        </button>
        <button onClick={() => setView('dodaj')} className={view === 'dodaj' ? 'font-bold' : ''}>
          Dodaj
        </button>
      </div>
      {view === 'lista' ? <ItemsList /> : <QuickAddForm onSaved={() => setView('lista')} />}
    </div>
  )
}

export default App