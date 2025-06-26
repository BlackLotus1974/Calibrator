// src/App.jsx

import React, { useState, useCallback, useEffect } from 'react';
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
import Auth from './components/Auth'; // Import Auth component
import AnalysisHistory from './components/AnalysisHistory'; // Import Analysis History component
import { parseFundamentals } from './utils/parseFundamentals.js'; // Ensure correct import path
import { StorageService } from './services/storageService'; // Correct import
import { SupabaseService } from './services/supabaseService'; // Import Supabase service

// Define the backend URL from environment variables or use default
const BACKEND_URL = import.meta.env.PROD ? '' : 'http://localhost:5000'; // Use relative path in production

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
  const [user, setUser] = useState(null); // State for authenticated user
  const [loading, setLoading] = useState(true); // Loading state for auth check
  const [isConfigValid, setConfigValid] = useState(true); // New state for config check

  // Check for authenticated user on app load
  useEffect(() => {
    // The check for Supabase client is removed from here to prevent a race condition.
    // The lazy-loaded supabase instance will handle initialization on first use.

    const checkUser = async () => {
      try {
        const currentUser = await SupabaseService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Handler for successful authentication
  const handleAuthSuccess = async () => {
    try {
      const currentUser = await SupabaseService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error getting user after auth:', error);
    }
  };

  // Handler for sign out
  const handleSignOut = async () => {
    try {
      await SupabaseService.signOut();
      setUser(null);
      handleReset(); // Reset app state
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handler for selecting an analysis from history
  const handleSelectAnalysis = (analysis) => {
    setInputData(analysis.input_data);
    setSelectedSections(analysis.selected_sections);
    setAnalysisResult(analysis.analysis_result);
    setCurrentStep('results');
    setNavigationHistory(['input', 'results']);
    
    // Navigate to analysis page
    window.location.href = '/analysis';
  };

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

      // Save to Supabase if user is authenticated
      if (user) {
        try {
          await SupabaseService.saveAnalysis({
            inputData: payload.inputData,
            selectedSections: payload.selectedSections,
            analysisResult: payload.sectionType === 'fundamentals' ? parseFundamentals(data.content) : data.content,
          });
          console.log('Analysis saved to Supabase successfully');
        } catch (supabaseError) {
          console.error('Error saving to Supabase:', supabaseError);
          // Don't fail the entire operation if Supabase save fails
        }
      }

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

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show a clear error screen if the configuration is invalid
  if (!isConfigValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 border-2 border-red-200 rounded-lg bg-white max-w-2xl">
          <h1 className="text-3xl font-bold text-red-700 mb-4">
            Application Configuration Invalid
          </h1>
          <p className="text-gray-700 text-lg mb-2">
            The application cannot connect to the backend services.
          </p>
          <p className="text-gray-600">
            Please check that your <strong>.env</strong> file in the project's root directory is correct and contains valid <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> values.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            After correcting the file, please restart the development server.
          </p>
        </div>
      </div>
    );
  }

  // Show authentication screen if user is not signed in
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <ErrorBoundary>
      {/* Header Component with Sign Out */}
      <Header user={user} onSignOut={handleSignOut} />

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
        
        {/* Analysis History Route */}
        <Route path="/history" element={<AnalysisHistory onSelectAnalysis={handleSelectAnalysis} />} />
        
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
