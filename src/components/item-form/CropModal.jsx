import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { getCroppedImg } from '../../lib/cropImage'

/**
 * Modal kadrowania (opcjonalny). Pokazuje wybrane zdjęcie z możliwością
 * przesuwania/zoom, a po zatwierdzeniu zwraca przycięty plik (JPEG).
 *
 * Props:
 *  - imageSrc: string (URL wybranego pliku)
 *  - aspect: number|undefined (np. 1 lub 16/9); undefined = brak sztywnej proporcji
 *  - onCancel: () => void
 *  - onConfirm: (blob: Blob) => void
 */
export default function CropModal({ imageSrc, aspect, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !processing) onCancel?.()
    }

    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onCancel, processing])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return

    try {
      setProcessing(true)
      setError(null)
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onConfirm?.(blob)
    } catch (err) {
      console.error('Błąd kadrowania:', err)
      setError('Nie udało się przyciąć zdjęcia.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Przytnij zdjęcie"
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
    >
      <div className="flex items-center justify-between p-4 text-white">
        <h3 className="text-base font-semibold">Przytnij zdjęcie</h3>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          aria-label="Anuluj kadrowanie"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/20 disabled:opacity-50"
        >
          ✕
        </button>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid
          objectFit="contain"
          restrictPosition
        />
      </div>

      <div className="space-y-3 p-4">
        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-3 text-white">
          <span className="text-xs">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="flex-1"
            aria-label="Powiększenie"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-500"
          >
            {processing ? 'Przetwarzanie...' : 'Zatwierdź'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 rounded-lg bg-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:bg-gray-400"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}
