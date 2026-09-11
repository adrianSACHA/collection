import { useEffect, useState } from 'react'


export default function PhotoPicker({
  label,
  className = '',
  existingUrl,
  onChange,
  onRemoveExisting,
  removing = false,
}) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    onChange(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(null)
    onChange(null)
    setPreviewUrl(null)
  }

  const displayUrl = previewUrl || existingUrl
  const showRemoveSelected = Boolean(selectedFile && previewUrl)
  const showRemoveExisting =
    !previewUrl && Boolean(existingUrl) && Boolean(onRemoveExisting)

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

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="w-full text-sm"
      />
    </div>
  )
}
