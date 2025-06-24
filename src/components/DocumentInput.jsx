// src/components/DocumentInput.jsx

import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, AlertCircle, Loader, Info } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000'; // Full Backend URL

export default function DocumentInput({ onSubmit, error, initialSelectedSections }) {
  const [missionStatement, setMissionStatement] = useState('');
  const [strategicText, setStrategicText] = useState('');
  const [selectedSections, setSelectedSections] = useState({
    fundamentals: true, // Always true as it's required
    strategy: false,
    insights: false,
  });
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [methodologyStatus, setMethodologyStatus] = useState({ loaded: false, custom: false });

  useEffect(() => {
    // Load saved form data
    const savedData = localStorage.getItem('documentInputData');
    if (savedData) {
      const { missionStatement: savedMission, strategicText: savedStrategic } = JSON.parse(savedData);
      setMissionStatement(savedMission || '');
      setStrategicText(savedStrategic || '');
    }

    // Check methodology status
    checkMethodologyStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem('documentInputData', JSON.stringify({
      missionStatement,
      strategicText
    }));
  }, [missionStatement, strategicText]);

  const checkMethodologyStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/methodology/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMethodologyStatus({ loaded: data.methodology !== null, custom: data.methodology?.custom || false });
      } else {
        setMethodologyStatus({ loaded: false, custom: false });
      }
    } catch (error) {
      console.error('Error checking methodology:', error);
      setMethodologyStatus({ loaded: false, custom: false });
    }
  };

  const handleSectionToggle = (sectionId) => {
    if (sectionId === 'fundamentals') return; // Can't toggle fundamentals

    setSelectedSections(prev => {
      const updated = { ...prev, [sectionId]: !prev[sectionId] };
      console.log('Updated selectedSections:', JSON.stringify(updated)); // Debugging
      return updated;
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (showUpload) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    }
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const validFiles = newFiles.filter(file => {
      const validType = validTypes.includes(file.type);
      const validSize = file.size <= maxSize;

      if (!validType || !validSize) {
        setLocalError(prev => {
          const typeError = !validType ? 'Some files were rejected. Only PDF, DOC, DOCX, and TXT files are allowed.' : '';
          const sizeError = !validSize ? 'Files must be smaller than 5MB.' : '';
          return `${prev ? prev + ' ' : ''}${typeError} ${sizeError}`.trim();
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setLocalError('');
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const conceptualizationPrompt = `Conceptualize: break down the text into different ideas or concepts so one can examine the systemic relationships between them:
1. Breaking down the raw text to uniquely distinguish between different concepts that are exhaustive and mutually exclusive.
2. Separate the ideas. Note where one idea begins and where it ends.
3. Write a unique title for each concept: the title should be a short concept or title that captures the idea.

1. Give titles that open up and stimulate thinking. The conceptual name should represent a new idea that provokes interpretation.
2. The name should be specific - it brings the essence of the thing in the most precise way - unlike a general name or title.
3. Give titles that indicate dynamics or movement. A concept is built from a noun or action word followed by adjectives or modifiers. For example: "The PR problem" rather than giving banal static titles like: "PR".`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    setLoading(true);

    try {
      // If the mission statement is empty, use the conceptualization prompt
      const missionToUse = missionStatement.trim() 
        ? missionStatement.trim() 
        : conceptualizationPrompt;

      if (!strategicText.trim()) {
        throw new Error('Please enter strategic text');
      }

      // Prepare files for upload
      const encodedFiles = await Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            data: reader.result.split(',')[1] // Remove data URL prefix
          });
          reader.onerror = error => reject(error);
        });
      }));

      // Prepare payload
      const payload = {
        sectionType: 'fundamentals',
        inputData: {
          missionStatement: missionToUse,
          strategicText: strategicText.trim(),
          files: encodedFiles
        },
        selectedSections
      };

      await onSubmit(payload);

    } catch (error) {
      setLocalError(error.message);
      console.error('Submission Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Selection */}
        <div>
          <label className="block font-medium mb-2">Select Analysis Sections</label>
          <div className="space-y-3">
            {Object.entries(selectedSections).map(([id, selected]) => (
              <div key={id} className="flex items-center">
                <input
                  type="checkbox"
                  id={id}
                  checked={selected}
                  onChange={() => handleSectionToggle(id)}
                  disabled={id === 'fundamentals' || loading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={id} className="ml-2 text-gray-700 capitalize">
                  {id.replace(/([A-Z])/g, ' $1')}
                  {id === 'fundamentals' && (
                    <span className="ml-2 text-sm text-blue-600">(Required)</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Statement Input */}
        <div>
          <label className="block font-medium mb-2">
            Mission Statement / Directive
          </label>
          <textarea
            value={missionStatement}
            onChange={(e) => setMissionStatement(e.target.value)}
            className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your directive or challenge to address..."
            disabled={loading}
          />
        </div>

        {/* Strategic Text Input */}
        <div>
          <label className="block font-medium mb-2">
            Strategic Text
          </label>
          <textarea
            value={strategicText}
            onChange={(e) => setStrategicText(e.target.value)}
            className="w-full p-3 border rounded-lg h-48 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your strategic text here..."
            disabled={loading}
            required
          />
        </div>

        {/* File Upload Section */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">Additional Documents (Optional)</h4>
              <p className="text-sm text-blue-600 mb-2">You may upload supporting documents if needed.</p>
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {showUpload ? 'Hide upload section' : 'Show upload section'}
              </button>
            </div>
          </div>
        </div>

        {showUpload && (
          <div 
            className={`border-2 border-dashed rounded-lg p-6 mt-4 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your files here, or
              </p>
              <label className="mt-2 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                Browse Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Supported files: PDF, DOC, DOCX, TXT (Max 5MB each)
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Uploaded Files:</h3>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Methodology Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700">Methodology Status</h4>
          {methodologyStatus.loaded ? (
            <p className="text-green-600">
              {methodologyStatus.custom 
                ? 'Custom methodology is loaded and ready to use.'
                : 'Default methodology is ready to use.'}
            </p>
          ) : (
            <p className="text-yellow-600">Loading methodology...</p>
          )}
        </div>

        {/* Error Message */}
        {(error || localError) && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error || localError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white py-3 px-4 rounded-lg flex items-center justify-center`}
        >
          {loading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Processing...
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </form>
    </div>
  );
}
