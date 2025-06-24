// src/components/StrategicCalibration.jsx

import React, { useState } from 'react';
import { Loader, AlertCircle, FileText, Check, X } from 'lucide-react';
import AnalysisResults from './AnalysisResults';
import { ApiService } from '../services/api';

const StrategicCalibration = () => {
  const [strategicText, setStrategicText] = useState('');
  const [methodologyFile, setMethodologyFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Allow only .docx for methodology upload
  const handleMethodologyChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        setMethodologyFile(file);
        setError('');
      } else {
        setError('Only .docx files are allowed for the methodology document.');
        setMethodologyFile(null);
      }
    }
  };

  // Allow only .docx for additional files
  const handleAdditionalFilesChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) =>
        file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (validFiles.length !== files.length) {
      setError('Only .docx files are allowed for additional documents.');
    } else {
      setError('');
    }

    setAdditionalFiles(validFiles);
  };

  const handleAnalyze = async () => {
    setError('');
    setAnalysisResult(null);
    setUploadSuccess(false);

    if (!strategicText.trim()) {
      setError('Please enter the strategic text.');
      return;
    }

    setLoading(true);

    try {
      // Create a FormData payload similar to ChallengeAnalysis but with analysisType set to 'strategic-calibration'
      const formData = new FormData();
      formData.append('analysisType', 'strategic-calibration');

      const inputData = {
        strategicText: strategicText.trim(),
      };

      formData.append('inputData', JSON.stringify(inputData));

      // Append files if provided
      if (methodologyFile) {
        formData.append('methodology', methodologyFile);
      }
      additionalFiles.forEach((file) => {
        formData.append('additionalDocuments', file);
      });

      console.log('Payload being sent:', {
        analysisType: 'strategic-calibration',
        inputData,
        files: { methodologyFile, additionalFiles },
      });

      const data = await ApiService.post('analyze', formData, true);
      setAnalysisResult(data.content);
      setUploadSuccess(true);
    } catch (err) {
      console.error('Analysis Error:', err);
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setStrategicText('');
    setMethodologyFile(null);
    setAdditionalFiles([]);
    setAnalysisResult(null);
    setError('');
    setUploadSuccess(false);
    // Reset file input values if possible
    const methodologyInput = document.getElementById('methodologyFile');
    if (methodologyInput) methodologyInput.value = '';
    const additionalInput = document.getElementById('additionalFiles');
    if (additionalInput) additionalInput.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Strategic Calibration</h2>

      <div className="mb-4">
        <label htmlFor="strategicText" className="block font-medium mb-2">
          Strategic Text
        </label>
        <textarea
          id="strategicText"
          value={strategicText}
          onChange={(e) => setStrategicText(e.target.value)}
          className="w-full p-3 border rounded-lg h-48 focus:ring-2 focus:ring-blue-500"
          placeholder="Paste your strategic text here..."
        />
      </div>

      <div className="mb-4">
        <label htmlFor="methodologyFile" className="block font-medium mb-2">
          Methodology Document (.docx) - Optional
        </label>
        <input
          type="file"
          id="methodologyFile"
          accept=".docx"
          onChange={handleMethodologyChange}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="additionalFiles" className="block font-medium mb-2">
          Additional Documents (.docx) - Optional
        </label>
        <input
          type="file"
          id="additionalFiles"
          accept=".docx"
          multiple
          onChange={handleAdditionalFilesChange}
          className="w-full"
        />
      </div>

      {error && (
        <div className="mb-4 w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="mb-4 w-full bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded flex items-center">
          <Check className="h-5 w-5 mr-2" />
          <span>Analysis completed successfully!</span>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className={`w-full bg-orange-400 hover:bg-orange-500 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${
          loading ? 'cursor-not-allowed opacity-70' : ''
        }`}
      >
        {loading ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            <span>Analyze</span>
          </>
        )}
      </button>

      <button
        onClick={handleClear}
        className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
      >
        <X className="h-4 w-4" />
        <span>Clear All</span>
      </button>

      {analysisResult && (
        <div className="mt-6">
          <AnalysisResults content={analysisResult} handleClear={handleClear} />
        </div>
      )}
    </div>
  );
};

export default StrategicCalibration;
