// Mała, reużywalna miniatura znaku wodnego banknotu.
//
// Używana w widoku listy (mobile: pod zdjęciem, desktop: obok zdjęcia),
// w widoku galerii (nakładka w prawym dolnym rogu zdjęcia) oraz w szczegółach.
// Dzięki temu logika altu i obsługa braków jest w jednym miejscu.
//
// Dane wejściowe:
// - `src`  – URL zdjęcia znaku wodnego (puste => komponent nic nie renderuje,
//            więc nie zostawiamy pustego placeholdera),
// - `name` – tekstowa nazwa znaku wodnego (pole `znak_wodny`); brak => neutralny alt.
export default function WatermarkThumbnail({
  src,
  name,
  className = '',
  imgClassName = '',
  overlay = false,
}) {
  // Brak zdjęcia znaku wodnego - nie pokazujemy pustego miejsca ani placeholdera.
  if (!src) return null

  const normalizedName = String(name || '').trim()
  const alt = normalizedName
    ? `Znak wodny: ${normalizedName}`
    : 'Znak wodny banknotu'

  // Wariant "overlay" (galeria) dostaje delikatną, półprzezroczystą powierzchnię,
  // żeby miniatura była czytelna na jasnym i ciemnym banknocie.
  const surfaceClass = overlay
    ? 'border border-white/70 bg-white/85 shadow-md backdrop-blur-sm'
    : 'border border-gray-200 bg-white'

  return (
    <div
      className={`overflow-hidden rounded-md ${surfaceClass} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-contain ${imgClassName}`}
      />
    </div>
  )
}
