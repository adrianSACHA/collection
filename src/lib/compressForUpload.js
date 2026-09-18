import { canvasToBlob } from './canvasToBlob'
import { compressImage } from './compressImage'

// Parametry kompresji dopasowane do limitu Supabase Storage (Free = 1 GB, ale
// zakładamy 0,5 GB). 3000 pozycji x 2 zdjęcia = 6000 plików; cel ~70 KB/zdjęcie
// -> ~420 MB < 500 MB. (Dla 1 GB: MAX_DIMENSION = 1280, MAX_SIZE_MB = 0.12.)
const MAX_DIMENSION = 1024
const MAX_SIZE_MB = 0.07
const INITIAL_QUALITY = 0.7

let webpSupportPromise = null

// Sprawdza (raz, z cache), czy przeglądarka umie wygenerować WebP.
// Część przeglądarek na żądanie WebP zwraca PNG, więc pytamy realny typ Blob-a.
function canEncodeWebp() {
  if (!webpSupportPromise) {
    webpSupportPromise = (async () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const blob = await canvasToBlob(canvas, 'image/webp', 0.8)
        return blob.type === 'image/webp'
      } catch {
        return false
      }
    })()
  }

  return webpSupportPromise
}

/**
 * Kompresuje zdjęcie przed uploadem do Supabase Storage.
 * 1) Preferowana ścieżka: biblioteka browser-image-compression (twardy limit
 *    rozmiaru przez maxSizeMB + poprawna obsługa orientacji EXIF), do WebP.
 * 2) Gdy biblioteki nie da się wczytać - fallback na Canvas API (compressImage).
 *
 * Metadane: wynik jest zawsze czystym rezultatem canvas (bez EXIF/GPS), bo
 * biblioteka kopiuje EXIF tylko przy preserveExif:true (domyślnie wyłączone).
 *
 * @param {File} file - oryginalny plik zdjęcia
 * @returns {Promise<File>} skompresowany plik (.webp, a w razie potrzeby .jpg)
 */
export async function compressForUpload(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('compressForUpload: plik nie jest obrazem')
  }

  const useWebp = await canEncodeWebp()

  try {
    const { default: imageCompression } = await import('browser-image-compression')

    return await imageCompression(file, {
      maxWidthOrHeight: MAX_DIMENSION,
      maxSizeMB: MAX_SIZE_MB,
      initialQuality: INITIAL_QUALITY,
      fileType: useWebp ? 'image/webp' : 'image/jpeg',
      // useWebWorker:true każe bibliotece ściągnąć samą siebie z CDN jsdelivr w
      // runtime (opcja libURL) i dopiero tam utworzyć Workera. Dla prywatnej/offline
      // apki zostawiamy false - kompresja na wątku głównym (dla <=1024 px jest szybka).
      // Alternatywa bez CDN: self-host pliku dist i podaj go przez libURL.
      useWebWorker: false,
    })
  } catch (error) {
    console.warn(
      'browser-image-compression niedostępne - używam fallbacku Canvas API:',
      error
    )
  }

  return compressImage(file, MAX_DIMENSION, INITIAL_QUALITY)
}
