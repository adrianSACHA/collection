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
 * Zamienia stopnie na radiany.
 */
function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Wymiary bounding boxa obrazu obróconego o podany kąt (w stopniach).
 * Po obrocie o 90°/270° szerokość i wysokość zamieniają się miejscami.
 */
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

/**
 * Przycina obraz do wskazanego obszaru (w pikselach oryginału)
 * i zwraca Blob (JPEG). Oryginał pozostaje nienaruszony.
 *
 * Obsługuje obrót (rotation) - najpierw obracamy cały obraz na pomocniczym
 * canvasie (z uwzględnieniem bounding boxa), a dopiero potem wycinamy obszar
 * kadru. Dzięki temu zapisany plik wygląda dokładnie tak jak podgląd.
 *
 * @param {string} imageSrc - URL obrazu (np. z URL.createObjectURL)
 * @param {{ x: number, y: number, width: number, height: number }} croppedAreaPixels
 * @param {number} [rotation=0] - obrót w stopniach (zgodny z react-easy-crop)
 * @param {number} [quality=0.92] - jakość JPEG (0-1)
 * @returns {Promise<Blob>}
 */
export async function getCroppedImg(
  imageSrc,
  croppedAreaPixels,
  rotation = 0,
  quality = 0.92
) {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Nie można utworzyć kontekstu canvas (brak wsparcia przeglądarki).')
  }

  // 1. Rysujemy CAŁY obraz na canvasie w rozmiarze jego obróconego bounding boxa.
  const rotRad = getRadianAngle(rotation)
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  canvas.width = Math.round(bBoxWidth)
  canvas.height = Math.round(bBoxHeight)

  // Przesuwamy środek układu do środka canvasa, obracamy i rysujemy obraz
  // wyśrodkowany (stąd dwa translate o połowę wymiarów).
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  // 2. Wycinamy właściwy obszar kadru z obróconego canvasa.
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    throw new Error('Nie można utworzyć kontekstu canvas (brak wsparcia przeglądarki).')
  }

  croppedCanvas.width = Math.round(croppedAreaPixels.width)
  croppedCanvas.height = Math.round(croppedAreaPixels.height)

  croppedCtx.drawImage(
    canvas,
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
    croppedCanvas.toBlob(
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
