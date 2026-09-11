export default function Lightbox({ url, label, onClose }) {

  if (!url) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Powiększone zdjęcie: ${label}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Zamknij powiększenie"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
      >
        ✕
      </button>

      <figure
        className="max-h-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={label}
          className="max-h-[85vh] w-auto rounded-lg object-contain"
        />
        <figcaption className="mt-2 text-center text-sm text-white/80">
          {label}
        </figcaption>
      </figure>
    </div>
  )
}
