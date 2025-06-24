// FILE: /src/components/AnalysisResults.jsx

import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Check,
  X,
  Loader,
  AlertCircle,
  FileText,
} from 'lucide-react';

/**
 * Modified extractJSONFromText function to handle both string and object inputs
 */
const extractJSONFromText = (input) => {
  console.log('Received input for extraction:', input);

  // If input is already an object, return it directly
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    console.log('Input is already an object, returning directly');
    return input;
  }

  if (typeof input !== 'string') {
    console.log('Input is not a string or object:', typeof input);
    return null;
  }

  // Clean the text
  const cleanText = input.replace(/^Analysis Results\s*/g, '').trim();
  console.log('Cleaned text:', cleanText);

  // Find JSON boundaries
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');

  console.log('JSON boundaries:', { firstBrace, lastBrace });

  if (firstBrace !== -1 && lastBrace !== -1) {
    try {
      const jsonStr = cleanText.substring(firstBrace, lastBrace + 1);
      console.log(
        'Attempting to parse JSON string:',
        jsonStr.substring(0, 100) + '...'
      );
      const parsed = JSON.parse(jsonStr);
      console.log('Successfully parsed JSON:', parsed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('JSON parsing error:', e);
    }
  }

  console.log('Falling back to wrapping text in object');
  return {
    "Analysis Results": cleanText,
  };
};

/**
 * Render arrays, with special styling based on item structure.
 */
const renderArray = (arr, parentKey = '') => {
  if (!Array.isArray(arr)) return null;

  // normalize the section title for comparison
  const normalizedKey = parentKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Check for { insight, implication } structure (e.g., Strategy, Structure, Priorities)
  const isInsightImplication = normalizedKey === 'Strategy' || normalizedKey === 'Strategic Priorities And Goals' || normalizedKey === 'Structure';
  // Check for { headline, explanation } structure (e.g., Opportunities, Core Insights)
  const isHeadlineExplanation = normalizedKey === 'Opportunities' || normalizedKey === 'Core Strategic Insights';

  // Render insight/implication items
  if (isInsightImplication) {
    return (
      <div className="space-y-4"> {/* Consistent spacing */}
        {arr.map((item, idx) => (
          item && typeof item === 'object' && item.insight && item.implication ? (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"> {/* Simple card style */}
              {/* Render insight as bold heading */}
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {item.insight}
              </h3>
              {/* Render implication as plain text */}
              <p className="text-sm text-gray-700"> {/* Slightly smaller text for implication */}
                {item.implication}
              </p>
            </div>
          ) : (
             // Handle unexpected item structure within these keys gracefully
             <div key={idx} className="text-sm text-red-600 italic">
               Unexpected item format: {JSON.stringify(item)}
             </div>
          )
        ))}
      </div>
    );
  }

  // Render headline/explanation items
  if (isHeadlineExplanation) {
    return (
      <div className="space-y-4"> {/* Consistent spacing */}
        {arr.map((item, idx) => (
           item && typeof item === 'object' && item.headline && item.explanation ? (
             // Use the blue style card from previous versions for these sections
             <div key={idx} className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
               <h4 className="font-semibold text-blue-800">{item.headline}</h4>
               <p className="text-sm text-blue-700">{item.explanation}</p>
             </div>
           ) : (
              // Handle unexpected item structure gracefully
              <div key={idx} className="text-sm text-red-600 italic">
                 Unexpected item format: {JSON.stringify(item)}
               </div>
           )
        ))}
      </div>
    );
  }

  // Fallback: simple bullet list for other arrays
  return (
    <ul className="list-disc ml-6 space-y-2"> {/* Adjusted margin/spacing */}
      {arr.map((item, idx) => (
        <li key={idx} className="text-gray-700">
          {/* Use renderValue which handles strings, objects, nested arrays */}
          {renderValue(item, parentKey)}
        </li>
      ))}
    </ul>
  );
};

// render any primitive, array, or object
const renderValue = (value, parentKey = '') => {
  if (value == null) return '';
  if (Array.isArray(value)) return renderArray(value, parentKey); // Pass parentKey here
  if (typeof value === 'object') return renderObject(value); // renderObject handles nested objects
  return String(value); // Render primitives directly
};

/**
 * Render objects by key, passing each value through renderValue().
 */
const renderObject = (obj) => {
  if (!obj || typeof obj !== 'object') return null;

  return Object.entries(obj).map(([key, val]) => {
    // if it's the solo "Analysis Results" key, just render its value without a heading
    if (key === "Analysis Results" && Object.keys(obj).length === 1) {
      return (
        <div key={key} className="prose prose-sm max-w-none"> {/* Use prose for better text formatting */}
          {renderValue(val, key)}
        </div>
      );
    }

    // Otherwise, render a section header + its content
    // Skip "Immediate Actions" section here too for consistency
     if (key === 'Immediate_Actions') {
         return null; // Don't render this section in the UI either
     }


    return (
      <div key={key} className="mb-6 last:mb-0">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200"> {/* Styled heading */}
          {key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())}
        </h3>
        <div className="pl-2"> {/* Slight indent for content under heading */}
          {renderValue(val, key)} {/* Pass key to renderValue -> renderArray */}
        </div>
      </div>
    );
  });
};

const AnalysisResults = ({ content, handleClear }) => {
  const [results, setResults] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');

  // Attempt to extract JSON for export
  const formatDataForExport = (data) => {
    if (!data) return null;
    // Ensure Immediate_Actions is removed before export if it somehow exists in the state
    if (typeof data === 'object' && data !== null) {
        const exportData = { ...data };
        delete exportData.Immediate_Actions; // Remove it if present

        // Check if it's just the fallback wrapper
        if (Object.keys(exportData).length === 1 && exportData["Analysis Results"]){
            // If the only key is "Analysis Results", try to parse *that* value
             const nestedParsed = extractJSONFromText(exportData["Analysis Results"]);
             if (nestedParsed && typeof nestedParsed === 'object' && Object.keys(nestedParsed).length > 0) {
                 delete nestedParsed.Immediate_Actions; // Ensure removed from nested too
                 return nestedParsed;
             }
             // If nested parse fails or is empty, return the simple wrapper (without Immediate Actions)
              return exportData;
        }

        return exportData; // Return data potentially cleaned of Immediate_Actions
    }
    // Handle string data - extraction handles structure, backend handles removal
    if (typeof data === 'string') {
      const extracted = extractJSONFromText(data);
       if (extracted && typeof extracted === 'object') {
            delete extracted.Immediate_Actions;
            return extracted;
       }
    }
    // Fallback for non-object/string or failed extraction
    return { "Analysis Results": String(data) };
  };

  useEffect(() => {
    if (!content) {
      setResults(null);
      setEditing(false); // Ensure editing is reset
      setEditedContent('');
    } else {
      let parsed = extractJSONFromText(content);
       // Also remove Immediate_Actions from initial state if present
        if (parsed && typeof parsed === 'object') {
           delete parsed.Immediate_Actions;
       }
      setResults(parsed);
       setEditing(false); // Reset editing state on new content
       setEditedContent('');
    }
  }, [content]);

   // Determine if there's content to display, excluding potential empty objects/arrays
   const hasDisplayableContent = (data) => {
     if (!data) return false;
     if (typeof data === 'string' && data.trim()) return true;
     if (typeof data === 'object') {
       // Check if object has keys AND those keys have non-empty values
       return Object.entries(data).some(([key, value]) => {
         if (key === 'Immediate_Actions') return false; // Ignore this key
         if (Array.isArray(value)) return value.length > 0;
         if (typeof value === 'object' && value !== null) return hasDisplayableContent(value); // Recurse for nested objects
         return value !== null && value !== undefined && String(value).trim() !== ''; // Check primitives/strings
       });
     }
     return false;
   };

   const displayableContentExists = hasDisplayableContent(results);

  const handleEditClick = () => {
    setEditing(true);
    // Ensure we edit the current state, formatted nicely
    let currentContentString;
    if (results && typeof results === 'object') {
        currentContentString = JSON.stringify(results, null, 2);
    } else {
        currentContentString = String(results || ''); // Handle null/undefined results
    }
    setEditedContent(currentContentString);
  };

  const handleSave = () => {
     let newResults;
     try {
       newResults = JSON.parse(editedContent);
       // Remove Immediate_Actions upon saving edited content
       if (newResults && typeof newResults === 'object') {
            delete newResults.Immediate_Actions;
       }
     } catch (e) {
        console.warn("Edited content is not valid JSON, saving as plain text under 'Analysis Results'");
        newResults = { "Analysis Results": editedContent };
     }

     // Check if the result is empty after potential removal/parsing
     if (!hasDisplayableContent(newResults)) {
         setResults(null); // Set to null if effectively empty
     } else {
         setResults(newResults);
     }
     setEditing(false);
  };

  const handleClearResults = () => {
    if (window.confirm('Are you sure you want to clear all analysis results?')) {
      setResults(null);
      setEditedContent('');
      setEditing(false);
      setExportError('');
      if (handleClear) {
          handleClear(); // Call the parent clear handler if provided
      }
    }
  };

  // handleExport remains largely the same, but uses the improved formatDataForExport
  const handleExport = async () => {
    try {
      setExportLoading(true);
      setExportError('');
      const payload = formatDataForExport(results); // Uses the updated function
      console.log("Data being sent for export:", payload); // Log export payload

      if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0 && !(payload["Analysis Results"]))) {
           throw new Error('No valid data available to export.');
      }


      const API_KEY = import.meta.env.VITE_API_KEY;
      const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${BACKEND_URL}/api/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        // Send the potentially cleaned payload
        body: JSON.stringify({ analysisResults: payload, analysisType: 'strategic-calibration' }),
      });

      if (!res.ok) {
        const txt = await res.text();
        let msg;
        try { msg = JSON.parse(txt).error } catch { msg = txt }
        throw new Error(`Export failed: ${msg || res.statusText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
       // Use a more descriptive filename if possible, fallback to generic
       const filename = `strategic-analysis-${Date.now()}.docx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setExportError(`Export failed: ${err.message}`);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-blue-600 p-6 transition-all duration-300 ease-in-out"> {/* Enhanced styling */}
        <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-gray-800"> {/* Title styling */}
              Challenge Analysis: Yallah, Walla Sababa
             </h2>
             {/* Edit button moved near title when content exists */}
             {!editing && displayableContentExists && (
                 <button
                   onClick={handleEditClick}
                   className="flex items-center text-sm text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                   title="Edit results"
                 >
                   <Edit2 className="h-4 w-4 mr-1" />
                   Edit
                 </button>
             )}
        </div>


        {!displayableContentExists ? ( // Use refined check
          <div className="text-center py-8">
             <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
             <p className="text-gray-500 italic text-lg">No analysis results to display yet.</p>
             <p className="text-gray-400 text-sm mt-2">Run an analysis to see the results here.</p>
          </div>
        ) : editing ? (
          <div className="space-y-4">
            <textarea
              className="w-full h-60 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm font-mono bg-gray-50" // Enhanced textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit JSON or text content..."
            />
            <div className="flex space-x-2 justify-end"> {/* Buttons on right */}
              <button
                onClick={() => { setEditing(false); /* Don't clear editedContent on cancel */ }}
                className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm transition-colors" // Style update
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm transition-colors" // Style update
              >
                <Check className="h-4 w-4 mr-1" />
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          // Render the structured content using the updated renderObject
          <div className="text-gray-800 leading-relaxed space-y-5"> {/* Added spacing */}
            {renderObject(results)}
          </div>
        )}
      </div>

       {/* Export/Clear buttons container */}
       {displayableContentExists && !editing && (
         <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
             {/* Export Error Display */}
            {exportError && (
              <div className="w-full sm:w-auto bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm flex items-center mr-auto"> {/* Error styling */}
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="flex-grow">{exportError}</span>
                 <button onClick={() => setExportError('')} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
              </div>
            )}

           <button
             onClick={handleExport}
             disabled={exportLoading}
             className={`flex items-center justify-center px-4 py-2 rounded-md w-full sm:w-auto text-sm font-medium transition-colors ${
               exportLoading
                 ? 'bg-gray-400 text-gray-700 cursor-wait' // Style for loading
                 : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' // Normal style
             }`}
             title="Export results to a Word document"
           >
             {exportLoading ? (
               <Loader className="h-4 w-4 animate-spin mr-2" />
             ) : (
               <FileText className="h-4 w-4 mr-2" />
             )}
             {exportLoading ? 'Exporting...' : 'Export to Word'}
           </button>

           <button
             onClick={handleClearResults}
             className="flex items-center justify-center px-4 py-2 rounded-md w-full sm:w-auto text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors" // Clear button style
             title="Clear current analysis results"
            >
             <X className="h-4 w-4 mr-2" />
             Clear Results
           </button>
         </div>
       )}
    </div>
  );
};

export default AnalysisResults;
