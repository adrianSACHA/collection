import { useState } from 'react'

export default function PhotoCapture({ onPhotosReady }) {
  const [awers, setAwers] = useState(null)
  const [rewers, setRewers] = useState(null)
  const [activeSide, setActiveSide] = useState('awers')

  const handlePhoto = (e, side) => {
    const file = e.target.files[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    const newPhoto = { file, previewUrl }

    let nextAwers = awers
    let nextRewers = rewers

    if (side === 'awers') {
      nextAwers = newPhoto
      setAwers(newPhoto)
    } else {
      nextRewers = newPhoto
      setRewers(newPhoto)
    }

    if (side === 'awers' && !nextRewers) {
      setActiveSide('rewers')
    } else if (side === 'rewers' && !nextAwers) {
      setActiveSide('awers')
    }

    if (nextAwers && nextRewers && onPhotosReady) {
      onPhotosReady({ awers: nextAwers, rewers: nextRewers })
    }
  }

  const retakePhoto = (side) => {
    if (side === 'awers') {
      setAwers(null)
    } else {
      setRewers(null)
    }
    setActiveSide(side)
  }

  const photoInputId = `photo-upload-${activeSide}`
  const currentPhoto = activeSide === 'awers' ? awers : rewers

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={activeSide === 'awers'}
          aria-label="Przełącz na awers"
          onClick={() => setActiveSide('awers')}
          className={`min-h-[44px] flex-1 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
            activeSide === 'awers'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Awers {awers ? '✓' : ''}
        </button>

        <button
          type="button"
          aria-pressed={activeSide === 'rewers'}
          aria-label="Przełącz na rewers"
          onClick={() => setActiveSide('rewers')}
          className={`min-h-[44px] flex-1 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
            activeSide === 'rewers'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rewers {rewers ? '✓' : ''}
        </button>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-100">
        {currentPhoto ? (
          <img
            src={currentPhoto.previewUrl}
            alt={activeSide === 'awers' ? 'Awers' : 'Rewers'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <svg className="mb-2 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">
              {activeSide === 'awers' ? 'Zrób zdjęcie awersu' : 'Zrób zdjęcie rewersu'}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {currentPhoto ? (
          <button
            type="button"
            onClick={() => retakePhoto(activeSide)}
            aria-label={activeSide === 'awers' ? 'Popraw zdjęcie awersu' : 'Popraw zdjęcie rewersu'}
            className="min-h-[44px] rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            Popraw zdjęcie
          </button>
        ) : (
          <label
            htmlFor={photoInputId}
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-sm transition hover:bg-blue-700 focus-within:ring-4 focus-within:ring-blue-300"
          >
            <input
              id={photoInputId}
              type="file"
              accept="image/*"
              capture="environment"
              aria-label={activeSide === 'awers' ? 'Dodaj zdjęcie awersu' : 'Dodaj zdjęcie rewersu'}
              className="sr-only"
              onChange={(e) => handlePhoto(e, activeSide)}
            />
            <svg aria-hidden="true" className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </label>
        )}
      </div>

      <div className="flex justify-center gap-4 text-sm">
        <span className={awers ? 'text-green-600' : 'text-gray-400'}>
          {awers ? '✓ Awers' : '○ Awers'}
        </span>
        <span className={rewers ? 'text-green-600' : 'text-gray-400'}>
          {rewers ? '✓ Rewers' : '○ Rewers'}
        </span>
      </div>
    </div>
  )
}