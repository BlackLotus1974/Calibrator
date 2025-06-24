// src/services/storageService.js

export const StorageService = {
  saveAnalysis(data) {
    localStorage.setItem('analysisResults', JSON.stringify(data));
  },

  getAnalysis() {
    const saved = localStorage.getItem('analysisResults');
    return saved ? JSON.parse(saved) : null;
  },

  clearAnalysis() {
    localStorage.removeItem('analysisResults');
    localStorage.removeItem('documentInputData');
  }
};
