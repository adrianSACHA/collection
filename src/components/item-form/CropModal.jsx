import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { getCroppedImg } from '../../lib/cropImage'

/**
 * Modal kadrowania (opcjonalny). Pokazuje wybrane zdjęcie z możliwością
 * przesuwania, zoom oraz obrotu skokowego o 90° (w lewo/prawo), a po
 * zatwierdzeniu zwraca przycięty plik (JPEG) z „wypalonym" obrotem.
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
  // Obrót w stopniach - sterowany przyciskami ±90° (zgodny z react-easy-crop).
  const [rotation, setRotation] = useState(0)
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
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
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
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
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

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setRotation((value) => value - 90)}
            aria-label="Obróć w lewo o 90 stopni"
            title="Obróć w lewo o 90°"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>

          <span className="w-16 text-center text-sm tabular-nums text-white">
            {((rotation % 360) + 360) % 360}°
          </span>

          <button
            type="button"
            onClick={() => setRotation((value) => value + 90)}
            aria-label="Obróć w prawo o 90 stopni"
            title="Obróć w prawo o 90°"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>

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
