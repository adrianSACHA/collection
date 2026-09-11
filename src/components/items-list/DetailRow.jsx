export default function DetailRow({ label, value }) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
