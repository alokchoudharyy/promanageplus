import { useState } from 'react'
import { SparklesIcon, ClockIcon, FlagIcon, LightBulbIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function AIAnalysisPanel({ analysis, onApply, onClose, loading }) {
  const [selectedFields, setSelectedFields] = useState({
    priority: true,
    deadline: true,
  })

  const toggleField = (field) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleApply = () => {
    const dataToApply = {}
    if (selectedFields.priority) dataToApply.priority = analysis.priority
    if (selectedFields.deadline) dataToApply.deadline = analysis.suggestedDeadline
    onApply(dataToApply)
  }

  const complexityColors = {
    simple: 'bg-green-100 text-green-700',
    moderate: 'bg-yellow-100 text-yellow-700',
    complex: 'bg-red-100 text-red-700',
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-purple-700 font-medium">AI is analyzing your task...</span>
        </div>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-bold text-purple-900">AI Analysis Results</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Priority */}
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FlagIcon className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-700">Priority</span>
            </div>
            <input
              type="checkbox"
              checked={selectedFields.priority}
              onChange={() => toggleField('priority')}
              className="w-4 h-4 text-purple-600 rounded"
            />
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase ${priorityColors[analysis.priority]}`}>
            {analysis.priority}
          </span>
        </div>

        {/* Deadline */}
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-700">Suggested Deadline</span>
            </div>
            <input
              type="checkbox"
              checked={selectedFields.deadline}
              onChange={() => toggleField('deadline')}
              className="w-4 h-4 text-purple-600 rounded"
            />
          </div>
          <p className="text-gray-900 font-semibold">
            {new Date(analysis.suggestedDeadline).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            (~{analysis.estimatedDays} day{analysis.estimatedDays !== 1 ? 's' : ''})
          </p>
        </div>

        {/* Complexity */}
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-700">Complexity</span>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase ${complexityColors[analysis.complexity]}`}>
            {analysis.complexity}
          </span>
        </div>

        {/* Estimated Days */}
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-gray-700">Estimated Time</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {analysis.estimatedDays} {analysis.estimatedDays === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm mb-4">
        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <LightBulbIcon className="h-5 w-5 text-yellow-500" />
          AI Reasoning
        </h4>
        <p className="text-sm text-gray-600 italic">"{analysis.reasoning}"</p>
      </div>

      {/* Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm mb-4">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-purple-600" />
            Smart Tips
          </h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={handleApply}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-semibold flex items-center justify-center gap-2 shadow-lg"
      >
        <SparklesIcon className="h-5 w-5" />
        Apply Selected AI Suggestions
      </button>
    </div>
  )
}
