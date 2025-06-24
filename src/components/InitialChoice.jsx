// src/components/InitialChoice.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const InitialChoice = () => {
  const navigate = useNavigate();

  const handleChoice = (choice) => {
    if (choice === 'challenge') {
      navigate('/challenge-analysis');
    } else if (choice === 'calibration') {
      navigate('/strategic-calibration');
    }
    // Note: Removed the Methodology Admin branch
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-8">Select an Option</h1>
      <div className="space-y-4">
        <button
          onClick={() => handleChoice('challenge')}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Challenge Analysis
        </button>
        <button
          onClick={() => handleChoice('calibration')}
          className="px-6 py-3 bg-orange-400 text-white rounded-md hover:bg-orange-600"
        >
          Strategic Calibration
        </button>
        {/* The Methodology Admin button has been removed */}
      </div>
    </div>
  );
};

export default InitialChoice;
