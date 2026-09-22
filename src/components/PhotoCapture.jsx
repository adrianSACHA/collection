import { useEffect, useRef, useState } from 'react'
import CropModal from './item-form/CropModal'
import { useStagedPhoto } from '../hooks/useStagedPhoto'

export default function PhotoCapture({ onPhotosReady, aspect }) {
  const [activeSide, setActiveSide] = useState('awers')
  const [cropping, setCropping] = useState(null) // 'awers' | 'rewers' | null

  // Awers i rewers to dwie niezależne instancje tego samego hooka - obie mają
  // ten sam cykl życia zdjęcia (podgląd, oryginał do kadrowania, sprzątanie
  // object URL-i przy odmontowaniu).
  const awers = useStagedPhoto()
  const rewers = useStagedPhoto()

  const stagedBySide = { awers, rewers }
  const activeStaged = stagedBySide[activeSide]

  // Rodzic dostaje wyłącznie pliki do wgrania. Object URL-e zostają w tym
  // komponencie (zwalnia je hook), więc nie wypuszczamy ich na zewnątrz -
  // rodzic mógłby trzymać adres, który już nie istnieje.
  //
  // Jedno miejsce zgłaszające stan, zamiast ręcznego wywołania w każdym
  // handlerze: wcześniej „Popraw zdjęcie" rewersu i zdjęcie samego rewersu
  // nie docierały do rodzica, więc skasowany plik wciąż szedł do uploadu.
  const onPhotosReadyRef = useRef(onPhotosReady)

  useEffect(() => {
    onPhotosReadyRef.current = onPhotosReady
  }, [onPhotosReady])

  useEffect(() => {
    onPhotosReadyRef.current?.({
      awers: awers.file,
      rewers: rewers.file,
    })
  }, [awers.file, rewers.file])

  const handlePhoto = (e, side) => {
    const file = e.target.files?.[0]

    // Reset wartości inputa, żeby kolejny wybór (nawet tego samego pliku)
    // zawsze odpalał onChange - na mobile bywa to źródłem "braku reakcji".
    e.target.value = ''

    if (!file) return

    stagedBySide[side].select(file)
  }

  // Nie przełączamy automatycznie na drugą stronę - zostajemy na tej, którą
  // właśnie zrobiono, żeby od razu można było ją przyciąć ("✂ Przytnij").
  const retakePhoto = (side) => {
    stagedBySide[side].clear()
    setActiveSide(side)
  }

  // Po zatwierdzeniu kadrowania hook podmienia plik na przycięty i utrzymuje
  // oryginał, więc „Przytnij" można powtarzać bez utraty jakości.
  const handleCropConfirm = (blob) => {
    if (!cropping) return

    stagedBySide[cropping].applyCrop(blob)
    setCropping(null)
  }

  const photoInputId = `photo-upload-${activeSide}`

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
          Awers {awers.file ? '✓' : ''}
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
          Rewers {rewers.file ? '✓' : ''}
        </button>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-100">
        {activeStaged.previewUrl ? (
          <img
            key={activeStaged.previewUrl}
            src={activeStaged.previewUrl}
            alt={activeSide === 'awers' ? 'Awers' : 'Rewers'}
            decoding="async"
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

      <div className="flex justify-center gap-3">
        {activeStaged.previewUrl ? (
          <>
            <button
              type="button"
              onClick={() => setCropping(activeSide)}
              aria-label={activeSide === 'awers' ? 'Przytnij zdjęcie awersu' : 'Przytnij zdjęcie rewersu'}
              className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              ✂ Przytnij
            </button>

            <button
              type="button"
              onClick={() => retakePhoto(activeSide)}
              aria-label={activeSide === 'awers' ? 'Popraw zdjęcie awersu' : 'Popraw zdjęcie rewersu'}
              className="min-h-[44px] rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              Popraw zdjęcie
            </button>
          </>
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
        <span className={awers.file ? 'text-green-600' : 'text-gray-500'}>
          {awers.file ? '✓ Awers' : '○ Awers'}
        </span>
        <span className={rewers.file ? 'text-green-600' : 'text-gray-500'}>
          {rewers.file ? '✓ Rewers' : '○ Rewers'}
        </span>
      </div>

      {cropping && stagedBySide[cropping].originalUrl && (
        <CropModal
          imageSrc={stagedBySide[cropping].originalUrl}
          aspect={aspect}
          onCancel={() => setCropping(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
