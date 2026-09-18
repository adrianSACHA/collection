/**
 * Zamienia zawartość <canvas> na Blob w sposób odporny na starsze przeglądarki.
 *
 * Dlaczego nie samo canvas.toBlob():
 *  - HTMLCanvasElement.prototype.toBlob nie istnieje w starszych przeglądarkach
 *    (np. Safari < 11, stare WebView na Androidzie). Wtedy wywołanie rzuca
 *    "canvas.toBlob is not a function" i psuje zarówno kompresję, jak i kadrowanie.
 *  - Nawet gdy toBlob istnieje, potrafi zwrócić null (np. przy bardzo dużym
 *    canvasie / brakach pamięci na słabym telefonie).
 *
 * W obu przypadkach używamy uniwersalnego canvas.toDataURL i sami budujemy Blob.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} [type='image/jpeg']
 * @param {number} [quality=0.6]
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.6) {
  return new Promise((resolve, reject) => {
    const fallbackToDataUrl = () => {
      try {
        const dataUrl = canvas.toDataURL(type, quality)
        const [meta, base64] = dataUrl.split(',')

        if (!base64) {
          reject(
            new Error('canvasToBlob: nie udało się wyeksportować obrazu (canvas zbyt duży?)')
          )
          return
        }

        // Używamy RZECZYWISTEGO typu z data URL, a nie żądanego: gdy przeglądarka
        // nie umie zakodować np. WebP, toDataURL zwraca inny format (np. image/png).
        const actualType = /^data:([^;]+)/.exec(meta)?.[1] || type

        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)

        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i)
        }

        resolve(new Blob([bytes], { type: actualType }))
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }

    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            fallbackToDataUrl()
          }
        },
        type,
        quality
      )
      return
    }

    fallbackToDataUrl()
  })
}
