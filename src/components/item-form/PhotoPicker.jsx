import { useEffect, useRef, useState } from 'react'
import CropModal from './CropModal'


export default function PhotoPicker({
  label,
  className = '',
  aspect,
  existingUrl,
  onChange,
  onRemoveExisting,
  removing = false,
}) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  // Oryginalny URL sprzed przycięcia - potrzebny, by móc kadrować (i wrócić) w każdej chwili.
  const [originalUrl, setOriginalUrl] = useState(null)
  const [isCropping, setIsCropping] = useState(false)

  // Trzymamy bieżące URL-e w ref, żeby cleanup przy odmontowaniu
  // odwołał aktualne (a nie te z pierwszego renderu).
  const urlsRef = useRef({ previewUrl, originalUrl })

  useEffect(() => {
    urlsRef.current = { previewUrl, originalUrl }
  }, [previewUrl, originalUrl])

  useEffect(() => {
    return () => {
      if (urlsRef.current.previewUrl) URL.revokeObjectURL(urlsRef.current.previewUrl)
      if (urlsRef.current.originalUrl) URL.revokeObjectURL(urlsRef.current.originalUrl)
    }
  }, [])

  const revoke = (url) => {
    if (url) URL.revokeObjectURL(url)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null

    if (!file) return

    revoke(previewUrl)
    revoke(originalUrl)

    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    onChange(file)
    setPreviewUrl(url)
    setOriginalUrl(url)
  }

  const clearSelectedFile = () => {
    revoke(previewUrl)
    revoke(originalUrl)
    setSelectedFile(null)
    onChange(null)
    setPreviewUrl(null)
    setOriginalUrl(null)
  }

  const handleCropConfirm = (blob) => {
    const croppedFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' })

    revoke(previewUrl)
    const newUrl = URL.createObjectURL(croppedFile)

    setSelectedFile(croppedFile)
    onChange(croppedFile)
    setPreviewUrl(newUrl)
    setIsCropping(false)
  }

  const displayUrl = previewUrl || existingUrl
  const showRemoveSelected = Boolean(selectedFile && previewUrl)
  const showRemoveExisting =
    !previewUrl && Boolean(existingUrl) && Boolean(onRemoveExisting)
  // Kadrować można tylko własne, świeżo wybrane zdjęcie.
  const showCrop = Boolean(originalUrl)

  return (
    <div className={className}>
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
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700"
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
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 disabled:bg-gray-400"
            >
              {removing ? '...' : '✕'}
            </button>
          )}
        </div>
      )}

      {showCrop && (
        <button
          type="button"
          onClick={() => setIsCropping(true)}
          className="mb-2 w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          ✂ Przytnij zdjęcie
        </button>
      )}

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="w-full text-sm"
      />

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
