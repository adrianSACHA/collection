import { useState } from 'react'
import CropModal from './CropModal'
import { useStagedPhoto } from '../../hooks/useStagedPhoto'


export default function PhotoPicker({
  label,
  aspect,
  existingUrl,
  onChange,
  onRemoveExisting,
  removing = false,
}) {
  const [isCropping, setIsCropping] = useState(false)

  // Cykl życia zdjęcia (object URL-e, oryginał do kadrowania, sprzątanie przy
  // odmontowaniu) siedzi w hooku - tutaj zostaje sam interfejs.
  const { previewUrl, originalUrl, canCrop, select, clear, applyCrop } =
    useStagedPhoto()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null

    if (!file) return

    // Reset wartości inputa, żeby ponowny wybór TEGO SAMEGO pliku też odpalił
    // onChange - na mobile bywa to źródłem „braku reakcji".
    e.target.value = ''

    select(file)
    onChange(file)
  }

  const clearSelectedFile = () => {
    clear()
    onChange(null)
  }

  const handleCropConfirm = (blob) => {
    const croppedFile = applyCrop(blob)

    if (!croppedFile) return

    onChange(croppedFile)
    setIsCropping(false)
  }

  const displayUrl = previewUrl || existingUrl
  const showRemoveSelected = Boolean(previewUrl)
  const showRemoveExisting =
    !previewUrl && Boolean(existingUrl) && Boolean(onRemoveExisting)

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      {displayUrl && (
        <div className="relative mb-2">
          <img
            src={displayUrl}
            alt={label}
            className="h-32 w-full rounded-lg border border-gray-200 object-contain"
          />

          {showRemoveSelected && (
            <button
              type="button"
              onClick={clearSelectedFile}
              aria-label={`Usuń wybrane zdjęcie: ${label}`}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700"
            >
              ✕
            </button>
          )}

          {showRemoveExisting && (
            <button
              type="button"
              onClick={onRemoveExisting}
              disabled={removing}
              aria-label={`Usuń zapisane zdjęcie: ${label}`}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 disabled:bg-gray-400"
            >
              {removing ? '...' : '✕'}
            </button>
          )}
        </div>
      )}

      {canCrop && (
        <button
          type="button"
          onClick={() => setIsCropping(true)}
          className="mb-2 w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          ✂ Przytnij zdjęcie
        </button>
      )}

      <input
        id={`photo-input-${label}`}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
      />

      <label
        htmlFor={`photo-input-${label}`}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus-within:ring-4 focus-within:ring-blue-300"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {displayUrl ? 'Zmień zdjęcie' : 'Wybierz zdjęcie'}
      </label>

      {isCropping && originalUrl && (
        <CropModal
          imageSrc={originalUrl}
          aspect={aspect}
          onCancel={() => setIsCropping(false)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
