// Czyste funkcje przycinania obrazu (canvas) - bez zależności od Reacta.
// Używane przez modal kadrowania (CropModal) do wygenerowania przyciętego pliku.

/**
 * Wczytuje obraz z URL (np. obiekt URL z wybranego pliku) do elementu Image.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (err) => reject(err))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = src
  })
}

/**
 * Przycina obraz do wskazanego obszaru (w pikselach oryginału)
 * i zwraca Blob (JPEG). Oryginał pozostaje nienaruszony.
 *
 * @param {string} imageSrc - URL obrazu (np. z URL.createObjectURL)
 * @param {{ x: number, y: number, width: number, height: number }} croppedAreaPixels
 * @param {number} [quality=0.92] - jakość JPEG (0-1)
 * @returns {Promise<Blob>}
 */
export async function getCroppedImg(imageSrc, croppedAreaPixels, quality = 0.92) {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Nie można utworzyć kontekstu canvas (brak wsparcia przeglądarki).')
  }

  canvas.width = Math.round(croppedAreaPixels.width)
  canvas.height = Math.round(croppedAreaPixels.height)

  ctx.drawImage(
    image,
    Math.round(croppedAreaPixels.x),
    Math.round(croppedAreaPixels.y),
    Math.round(croppedAreaPixels.width),
    Math.round(croppedAreaPixels.height),
    0,
    0,
    Math.round(croppedAreaPixels.width),
    Math.round(croppedAreaPixels.height)
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Nie udało się wygenerować przyciętego obrazu.'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality
    )
  })
}
