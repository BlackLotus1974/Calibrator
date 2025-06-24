import React, { useState, useEffect } from 'react'
import { SupabaseService } from '../services/supabaseService'
import { formatDistanceToNow } from 'date-fns'

export default function AnalysisHistory({ onSelectAnalysis }) {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    try {
      setLoading(true)
      const data = await SupabaseService.getAnalyses()
      setAnalyses(data)
    } catch (error) {
      setError('Failed to load analysis history')
      console.error('Error loading analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return
    }

    try {
      await SupabaseService.deleteAnalysis(id)
      setAnalyses(analyses.filter(analysis => analysis.id !== id))
    } catch (error) {
      setError('Failed to delete analysis')
      console.error('Error deleting analysis:', error)
    }
  }

  const getAnalysisTitle = (analysis) => {
    const inputData = analysis.input_data
    if (inputData.missionStatement) {
      return inputData.missionStatement.substring(0, 50) + '...'
    }
    if (inputData.strategicText) {
      return inputData.strategicText.substring(0, 50) + '...'
    }
    return 'Untitled Analysis'
  }

  const getSelectedSectionsText = (selectedSections) => {
    const sections = []
    if (selectedSections.fundamentals) sections.push('Fundamentals')
    if (selectedSections.strategy) sections.push('Strategy')
    if (selectedSections.insights) sections.push('Insights')
    return sections.join(', ') || 'No sections'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analysis History</h2>
        <button
          onClick={loadAnalyses}
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {analyses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No analyses found. Create your first analysis to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {getAnalysisTitle(analysis)}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Sections:</span> {getSelectedSectionsText(analysis.selected_sections)}
                    </p>
                    <p>
                      <span className="font-medium">Created:</span>{' '}
                      {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                    </p>
                    {analysis.updated_at !== analysis.created_at && (
                      <p>
                        <span className="font-medium">Updated:</span>{' '}
                        {formatDistanceToNow(new Date(analysis.updated_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onSelectAnalysis(analysis)}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 border border-indigo-600 rounded hover:bg-indigo-50"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(analysis.id)}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-500 border border-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 