// src/App.jsx

import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import InitialChoice from './components/InitialChoice';
import ChallengeAnalysis from './components/ChallengeAnalysis';
import StrategicCalibration from './components/StrategicCalibration';
import DocumentInput from './components/DocumentInput';
import AnalysisSelection from './components/AnalysisSelection';
import AnalysisResults from './components/AnalysisResults';
import ErrorBoundary from './components/ErrorBoundary';
import ProgressSteps from './components/ProgressSteps';
import Header from './components/Header'; // Import the Header component
import { parseFundamentals } from './utils/parseFundamentals.js'; // Ensure correct import path
import { StorageService } from './services/storageService'; // Correct import

// Define the backend URL from environment variables or use default
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  // State variables
  const [currentStep, setCurrentStep] = useState('input');
  const [inputData, setInputData] = useState(null);
  const [selectedSections, setSelectedSections] = useState({
    fundamentals: true,
    strategy: false,
    insights: false,
  });
  const [navigationHistory, setNavigationHistory] = useState(['input']);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null); // New state for analysis results

  // Handler for analyzing data
  const handleAnalyze = async (payload) => {
    try {
      setError(null);

      // API endpoint
const API_URL = `${BACKEND_URL}/api/analyze`;

      console.log('Submitting payload to backend:', JSON.stringify(payload));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log('Received response from backend:', response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to process analysis.');
      }

      const data = await response.json();
      console.log('Analysis Result:', data);

      // Parse 'Fundamentals' if applicable
      if (payload.sectionType === 'fundamentals') {
        const parsedResult = parseFundamentals(data.content);
        setAnalysisResult(parsedResult);
      } else {
        setAnalysisResult(data.content);
      }

      // Save input data and selected sections
      setInputData(payload.inputData);
      setSelectedSections(payload.selectedSections);

      // Save analysis results to localStorage
      StorageService.saveAnalysis({
        inputData: payload.inputData,
        selectedSections: payload.selectedSections,
        analysisResult: payload.sectionType === 'fundamentals' ? parseFundamentals(data.content) : data.content,
      });

      // Navigate to 'results' step
      handleStepChange('results');

    } catch (error) {
      console.error('Error in handleAnalyze:', error);
      setError(error.message);
    }
  };

  // Function to check if navigation to a step is allowed
  const canNavigateToStep = useCallback((stepId) => {
    switch (stepId) {
      case 'input':
        return true;
      case 'selection':
        return !!inputData;
      case 'results':
        return !!inputData && !!selectedSections && !!analysisResult; // Ensure analysis result is present
      default:
        return false;
    }
  }, [inputData, selectedSections, analysisResult]);

  // Handler to change steps
  const handleStepChange = (stepId) => {
    if (!canNavigateToStep(stepId)) return;
    setCurrentStep(stepId);
    setNavigationHistory(prev => [...prev, stepId]);
  };

  // Handler to go back to the previous step
  const handleBack = () => {
    const newHistory = [...navigationHistory];
    newHistory.pop();
    const previousStep = newHistory[newHistory.length - 1];

    setCurrentStep(previousStep);
    setNavigationHistory(newHistory);
  };

  // Handler to reset the entire flow
  const handleReset = () => {
    StorageService.clearAnalysis();
    setCurrentStep('input');
    setInputData(null);
    setSelectedSections({
      fundamentals: true,
      strategy: false,
      insights: false,
    });
    setAnalysisResult(null); // Reset analysis result
    setNavigationHistory(['input']);
    setError(null);
  };

  // Main content rendering based on current step
  const MainContent = () => {
    const renderStep = () => {
      switch (currentStep) {
        case 'input':
          return (
            <DocumentInput 
              onSubmit={handleAnalyze}
              error={error}
              initialSelectedSections={{
                fundamentals: true,
                strategy: false,
                insights: false,
              }}
            />
          );
        case 'selection':
          return (
            <AnalysisSelection 
              onSelectionChange={selections => {
                setSelectedSections(selections);
                handleStepChange('results');
              }}
              initialSelections={selectedSections}
            />
          );
        case 'results':
          return (
            <AnalysisResults 
              selectedSections={selectedSections}
              inputData={inputData}
              analysisResult={analysisResult} // Pass parsed analysis result to component
            />
          );
        default:
          return null;
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Strategic Calibrator
            </h1>
            <div className="flex items-center space-x-4">
              {/* Back Button */}
              {currentStep !== 'input' && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </button>
              )}
              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Start Over
              </button>
              {/* Removed the "Manage Methodology" Link */}
            </div>
          </div>
          {/* Progress Steps */}
          <ProgressSteps 
            currentStep={currentStep}
            onStepClick={handleStepChange}
            canNavigateToStep={canNavigateToStep}
          />
          {/* Main Content */}
          <main className="mt-8">
            {renderStep()}
          </main>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      {/* Header Component */}
      <Header />

      {/* Main Routes */}
      <Routes>
        {/* Initial Choice Route */}
        <Route path="/" element={<InitialChoice />} />
        
        {/* Main Analysis Flow Route */}
        <Route path="/analysis" element={<MainContent />} />
        
        {/* Challenge Analysis Route */}
        <Route path="/challenge-analysis" element={<ChallengeAnalysis />} />
        
        {/* Strategic Calibration Route */}
        <Route path="/strategic-calibration" element={<StrategicCalibration />} />
        
        {/* Removed the Methodology Admin Route */}
        
        {/* Fallback Route */}
        <Route path="*" element={
          <div className="flex items-center justify-center h-screen">
            <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
          </div>
        } />
      </Routes>
    </ErrorBoundary>
  );
}
