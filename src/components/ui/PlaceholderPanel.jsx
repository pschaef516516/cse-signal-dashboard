export default function PlaceholderPanel({ title, description }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center gap-2 min-h-[180px]">
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      <p className="text-xs text-gray-400 text-center max-w-xs">{description}</p>
    </div>
  )
}
