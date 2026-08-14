import { useState, useRef } from 'react'

export default function PhotoCapture({ onPhotosReady }) {
  const [awers, setAwers] = useState(null)
  const [rewers, setRewers] = useState(null)
  const [activeSide, setActiveSide] = useState('awers')
  const fileInputRef = useRef(null)

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

  const currentPhoto = activeSide === 'awers' ? awers : rewers

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveSide('awers')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeSide === 'awers'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Awers {awers && '✓'}
        </button>
        <button
          type="button"
          onClick={() => setActiveSide('rewers')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeSide === 'rewers'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rewers {rewers && '✓'}
        </button>
      </div>

      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300">
        {currentPhoto ? (
          <img
            src={currentPhoto.previewUrl}
            alt={activeSide === 'awers' ? 'Awers' : 'Rewers'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Popraw zdjęcie
          </button>
        ) : (
          <label className="cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhoto(e, activeSide)}
              className="hidden"
            />
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
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