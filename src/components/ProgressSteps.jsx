// src/components/ProgressSteps.jsx
import React from 'react';
import { Check } from 'lucide-react';

export default function ProgressSteps({ currentStep, onStepClick, canNavigateToStep }) {
  const steps = [
    { id: 'input', label: 'Document Input' },
    { id: 'selection', label: 'Analysis Selection' },
    { id: 'results', label: 'Results' }
  ];

  return (
    <div className="mb-8">
      <div className="max-w-4xl mx-auto">
        <nav aria-label="Progress" role="navigation">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => {
              const isComplete = stepIdx < steps.findIndex(s => s.id === currentStep);
              const isCurrent = step.id === currentStep;
              const canNavigate = canNavigateToStep?.(step.id) ?? true;

              return (
                <li 
                  key={step.id} 
                  className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}
                >
                  <div className="flex items-center">
                    <button
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                        isCurrent 
                          ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-600' 
                          : isComplete
                          ? 'bg-blue-400 text-white cursor-pointer hover:bg-blue-500'
                          : 'bg-gray-200 cursor-not-allowed'
                      } ${!canNavigate && 'opacity-50 cursor-not-allowed'}`}
                      onClick={() => canNavigate && onStepClick?.(step.id)}
                      disabled={!canNavigate}
                      aria-current={isCurrent ? 'step' : undefined}
                      title={!canNavigate ? 'Complete current step first' : ''}
                    >
                      {isComplete ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-current" />
                      )}
                    </button>
                    {stepIdx !== steps.length - 1 && (
                      <div 
                        className={`absolute top-4 w-full h-0.5 transition-colors ${
                          isComplete ? 'bg-blue-400' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <span className="absolute -bottom-6 w-max text-sm font-medium text-gray-500">
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
