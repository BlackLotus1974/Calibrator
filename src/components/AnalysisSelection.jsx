// src/components/AnalysisSelection.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Info, Loader, ArrowRight } from 'lucide-react';

// Define the available sections
const analysisOptions = [
  {
    id: 'fundamentals',
    title: 'Fundamentals',
    description: 'Core organizational vision, mission, and purpose',
    category: 'fundamentals',
    permanent: true,
    defaultSelected: true,
  },
  {
    id: 'strategy',
    title: 'Strategy Principles & Projects',
    description: 'Design thinking and SCAMPER-based strategic planning',
    category: 'analysis',
    defaultSelected: false,
  },
  {
    id: 'insights',
    title: 'Actionable Insights',
    description: 'Strategic insights and knowledge discovery',
    category: 'analysis',
    defaultSelected: false,
  },
  // Removed unwanted sections:
  // {
  //   id: 'structure',
  //   title: 'Structure',
  //   description: 'Organizational design and structural analysis',
  //   category: 'analysis',
  //   defaultSelected: false,
  // },
  // {
  //   id: 'economic',
  //   title: 'Economic Model',
  //   description: 'Financial and business model analysis',
  //   category: 'analysis',
  //   defaultSelected: false,
  // },
  // {
  //   id: 'newKnowledge',
  //   title: 'New Knowledge',
  //   description: 'Concept mapping and knowledge enrichment',
  //   category: 'newKnowledge',
  //   defaultSelected: false,
  // },
];

// AnalysisOption Component
const AnalysisOption = ({
  option,
  selected,
  onToggle,
  activeTooltip,
  setActiveTooltip,
}) => {
  return (
    <div
      className={`relative flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
        option.permanent
          ? 'border-blue-500 bg-blue-50 cursor-default'
          : selected
          ? 'border-blue-500 bg-blue-50 cursor-pointer'
          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
      }`}
      onClick={() => !option.permanent && onToggle(option.id)}
    >
      <div className="flex-shrink-0">
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            selected
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300'
          }`}
        >
          {selected && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">
            {option.title}
            {option.permanent && (
              <span className="ml-2 text-sm text-blue-600">(Required)</span>
            )}
          </h3>
          <div className="tooltip-container relative">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTooltip(
                  activeTooltip === option.id ? null : option.id
                );
              }}
            >
              <Info className="h-4 w-4" />
            </button>
            {activeTooltip === option.id && (
              <div className="absolute z-10 w-64 p-3 mt-1 text-sm text-white bg-gray-900 rounded-lg shadow-lg right-0">
                {option.description}
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-500 mt-1">{option.description}</p>
      </div>
    </div>
  );
};

// AnalysisSelection Component
const AnalysisSelection = ({ onSelectionChange, initialSelections = null }) => {
  const [selectedOptions, setSelectedOptions] = useState(
    initialSelections ||
      analysisOptions.reduce((acc, option) => {
        acc[option.id] = option.permanent || option.defaultSelected;
        return acc;
      }, {})
  );
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.tooltip-container')) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle toggling of individual options
  const handleOptionToggle = useCallback(
    (optionId) => {
      const option = analysisOptions.find((opt) => opt.id === optionId);
      if (option?.permanent) return;

      setSelectedOptions((prev) => ({
        ...prev,
        [optionId]: !prev[optionId],
      }));
    },
    [setSelectedOptions]
  );

  // Handle bulk selection (Select All / Clear Optional)
  const handleBulkSelection = useCallback(
    (selectAll) => {
      setSelectedOptions((prev) => {
        const newSelections = { ...prev };
        analysisOptions.forEach((option) => {
          if (!option.permanent) {
            newSelections[option.id] = selectAll;
          }
        });
        return newSelections;
      });
    },
    [setSelectedOptions]
  );

  // Handle proceeding to the next step
  const handleProceed = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Validate at least one non-fundamental selection
      const hasNonFundamentalSelection = Object.entries(selectedOptions).some(
        ([id, selected]) => {
          const option = analysisOptions.find((opt) => opt.id === id);
          return selected && !option.permanent;
        }
      );

      if (!hasNonFundamentalSelection) {
        throw new Error(
          'Please select at least one analysis section beyond Fundamentals'
        );
      }

      await onSelectionChange?.(selectedOptions);
    } catch (error) {
      setError(error.message);
      console.error('Selection Error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOptions, onSelectionChange]);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Analysis Sections
        </h2>
        <p className="text-gray-600">
          Fundamentals analysis is required. Select additional sections for
          comprehensive analysis.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Fundamentals Section */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fundamentals</h3>
          <div className="grid gap-4">
            {analysisOptions
              .filter((option) => option.category === 'fundamentals')
              .map((option) => (
                <AnalysisOption
                  key={option.id}
                  option={option}
                  selected={selectedOptions[option.id]}
                  onToggle={handleOptionToggle}
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                />
              ))}
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Analysis Sections
          </h3>
          <div className="grid gap-4">
            {analysisOptions
              .filter((option) => option.category === 'analysis')
              .map((option) => (
                <AnalysisOption
                  key={option.id}
                  option={option}
                  selected={selectedOptions[option.id]}
                  onToggle={handleOptionToggle}
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                />
              ))}
          </div>
        </div>

        {/* New Knowledge Section (Removed) */}
        {/* Since 'New Knowledge' is no longer needed, this section is removed */}
        {/* <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Knowledge</h3>
          <div className="grid gap-4">
            {analysisOptions
              .filter((option) => option.category === 'newKnowledge')
              .map((option) => (
                <AnalysisOption
                  key={option.id}
                  option={option}
                  selected={selectedOptions[option.id]}
                  onToggle={handleOptionToggle}
                  activeTooltip={activeTooltip}
                  setActiveTooltip={setActiveTooltip}
                />
              ))}
          </div>
        </div> */}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <div className="space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => handleBulkSelection(false)}
            disabled={loading}
          >
            Clear Optional
          </button>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => handleBulkSelection(true)}
            disabled={loading}
          >
            Select All
          </button>
        </div>

        <button
          onClick={handleProceed}
          disabled={loading}
          className={`px-6 py-2 rounded-md flex items-center space-x-2 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? (
            <Loader className="animate-spin h-5 w-5" />
          ) : (
            <>
              <span>Next</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnalysisSelection;
