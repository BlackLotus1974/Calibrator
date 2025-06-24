// src/utils/test-utils.js
export const testData = {
  missionStatement: "To become the leading provider of innovative solutions...",
  strategicText: "Our organization aims to focus on the following key areas...",
  sampleFiles: [
    new File(['test content'], 'test.pdf', { type: 'application/pdf' }),
    new File(['test content'], 'test.txt', { type: 'text/plain' })
  ],
  sampleSections: {
    vision: true,
    mission: true,
    purpose: true,
    strategy: false,
    insights: true
  }
};

export const validateInputData = (data) => {
  const errors = [];
  
  if (!data.missionStatement?.trim()) {
    errors.push('Mission statement is required');
  }
  
  if (!data.strategicText?.trim()) {
    errors.push('Strategic text is required');
  }
  
  if (!data.files?.length) {
    errors.push('At least one file is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSelections = (selections) => {
  const selectedCount = Object.values(selections).filter(Boolean).length;
  return {
    isValid: selectedCount > 0,
    error: selectedCount === 0 ? 'Select at least one section' : null
  };
};