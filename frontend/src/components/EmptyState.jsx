export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      {Icon && <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-6 py-3 rounded-md hover:opacity-90 transition shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
