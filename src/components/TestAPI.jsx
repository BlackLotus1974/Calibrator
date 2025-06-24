// src/components/TestAPI.jsx
import React, { useState, useEffect } from 'react';
import { StrategicAnalysisService } from '../services/api';
import { Loader } from 'lucide-react';

export const TestAPI = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Debug information (Updated for Gemini)
    setDebugInfo({
      apiKeyExists: !!import.meta.env.VITE_GEMINI_API_KEY, // Check for Gemini Key
      apiKeyStart: import.meta.env.VITE_GEMINI_API_KEY // Use Gemini Key
        ? import.meta.env.VITE_GEMINI_API_KEY.substring(0, 5)
        : 'none',
      envVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
      fullEnv: JSON.stringify(
        Object.fromEntries(
          Object.entries(import.meta.env).filter(([key]) => key.startsWith('VITE_'))
        ),
        null,
        2
      ),
      rawApiKey: import.meta.env.VITE_GEMINI_API_KEY || 'not found' // Use Gemini Key
    });

    // Additional Console Log
    console.log('Environment Variables:', import.meta.env);
  }, []);

  const testAPI = async () => {
    setLoading(true);
    setError('');

    try {
      const testData = {
        missionStatement: "Test mission statement for API integration",
        strategicText: "Test strategic text for analysis",
        files: []
      };

      const response = await StrategicAnalysisService.analyzeSection(
        'vision', // Example section type
        testData,
        { vision: true }
      );

      setResult(response);
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err.message || 'An error occurred during API testing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">API Integration Test</h2>
      
      {/* Debug Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <pre className="text-sm overflow-x-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <button
          onClick={testAPI}
          disabled={loading}
          className={`w-full px-4 py-2 rounded-md text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Testing API Connection...
            </span>
          ) : (
            'Test API Connection'
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && !error && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-800 font-medium">Success!</h3>
            <div className="mt-2 text-green-600">
              <p className="font-medium">API Response:</p>
              <p className="whitespace-pre-wrap">{result}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
