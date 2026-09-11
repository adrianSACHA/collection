export default function LoadingFallback({ label = 'Wczytywanie…' }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue-600/30 border-t-blue-600 motion-safe:animate-spin" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
