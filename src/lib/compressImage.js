/**
 * Kompresuje zdjęcie w przeglądarce przed uploadem (Canvas API).
 * Zmniejsza rozdzielczość do maxDimension (dłuższa strona) i koduje jako JPEG
 * z podaną jakością. Dla zdjęć monet/banknotów 1200px + quality 0.7 daje
 * bezpieczny margines: nadal widać detale stempla/druku, plik spada z ~3-5 MB
 * do ~100-150 KB (przy ~2000 pozycjach x 2 zdjęcia to orientacyjnie 400-600 MB,
 * bezpiecznie w granicach darmowego 1 GB limitu Supabase Storage).
 *
 * @param {File} file - oryginalny plik (z inputa/kamery)
 * @param {number} maxDimension - maksymalna szerokość/wysokość w px (domyślnie 1200)
 * @param {number} quality - jakość JPEG 0-1 (domyślnie 0.7)
 * @returns {Promise<File>} nowy, skompresowany plik (zawsze .jpg)
 */
export function compressImage(file, maxDimension = 1200, quality = 0.7) {
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
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)

          if (!blob) {
            reject(new Error('compressImage: nie udało się zakodować obrazu'))
            return
          }

          const originalName = file.name.replace(/\.[^.]+$/, '')
          const compressedFile = new File([blob], `${originalName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('compressImage: nie udało się wczytać obrazu'))
    }

    img.src = objectUrl
  })
}