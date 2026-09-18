import { canvasToBlob } from './canvasToBlob'

/**
 * Kompresja przez Canvas API (fallback bez zależności, używany przez
 * compressForUpload, gdy biblioteka jest niedostępna).
 * Zmniejsza zdjęcie do maxDimension (dłuższa strona) i koduje jako WebP, a gdy
 * przeglądarka nie umie WebP - jako JPEG.
 *
 * @param {File} file - oryginalny plik (z inputa/kamery)
 * @param {number} maxDimension - maksymalna szerokość/wysokość w px
 * @param {number} quality - jakość 0-1
 * @returns {Promise<File>} skompresowany plik (.webp albo .jpg)
 */
export function compressImage(file, maxDimension = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('compressImage: plik nie jest obrazem'))
      return
    }


    const img = new Image()
    const objectUrl = URL.createObjectURL(file)


    img.onload = () => {
      let { width, height } = img


      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }


      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height


      const ctx = canvas.getContext('2d')

      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('compressImage: brak kontekstu canvas'))
        return
      }

      // Lepsza jakość skalowania w dół - mniej rozmycia przy zdjęciach
            // z telefonu (np. 4000 px -> 1000 px) niż domyślne ustawienie.
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Najpierw WebP; gdy przeglądarka go nie umie, canvasToBlob zwróci inny
      // typ (np. image/png) i wtedy kodujemy JPEG - bezpieczny, uniwersalny format.
      canvasToBlob(canvas, 'image/webp', quality)
        .then(async (webpBlob) => {
          let blob = webpBlob

          if (blob.type !== 'image/webp') {
            blob = await canvasToBlob(canvas, 'image/jpeg', quality)
          }

          URL.revokeObjectURL(objectUrl)

          const originalName = file.name.replace(/\.[^.]+$/, '')
          const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
          const compressedFile = new File([blob], `${originalName}.${extension}`, {
            type: blob.type,
            lastModified: Date.now(),
          })

          resolve(compressedFile)
        })
        .catch(() => {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('compressImage: nie udało się zakodować obrazu'))
        })
    }


    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('compressImage: nie udało się wczytać obrazu'))
    }


    img.src = objectUrl
  })
}