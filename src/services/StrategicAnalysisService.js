// FILE: /src/services/StrategicAnalysisService.js

export class StrategicAnalysisService {
  static BASE_URL = 'http://localhost:5000/api';
  static RETRY_DELAY = 60000; // 1 minute

  static async analyzeSection(sectionType, inputData, selectedSections) {
    try {
      // Add triple‐backtick JSON requirement
      const tripleBacktickNote = `
IMPORTANT: Return your final answer in triple-backticks labeled \`json\`, for example:

\`\`\`json
{
  "exampleKey": "exampleValue"
}
\`\`\`
`;

      // If we have missionStatement or strategicText, append the note
      if (inputData.missionStatement) {
        inputData.missionStatement += `\n\n${tripleBacktickNote}`;
      } else if (inputData.strategicText) {
        inputData.strategicText += `\n\n${tripleBacktickNote}`;
      }

      const response = await fetch(`${this.BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // If you need an x-api-key, add it here:
          // 'x-api-key': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({
          sectionType,
          inputData,
          selectedSections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait before trying again.');
        }
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.content,
        analysisId: `${sectionType}-${Date.now()}`,
      };
    } catch (error) {
      console.error('Analysis API Error:', error);
      throw error;
    }
  }

  static async saveAnalysis(analysisId, content) {
    // No changes needed here
    try {
      const response = await fetch(`${this.BASE_URL}/analysis/${analysisId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save analysis');
      }

      return await response.json();
    } catch (error) {
      console.error('Save Analysis Error:', error);
      throw error;
    }
  }

  static async getAllAnalyses() {
    // No changes needed
    try {
      const response = await fetch(`${this.BASE_URL}/analyses`);
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }
      return await response.json();
    } catch (error) {
      console.error('Get Analyses Error:', error);
      throw error;
    }
  }

  static async getAnalysis(id) {
    // No changes needed
    try {
      const response = await fetch(`${this.BASE_URL}/analysis/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      return await response.json();
    } catch (error) {
      console.error('Get Analysis Error:', error);
      throw error;
    }
  }

  static async deleteAnalysis(id) {
    // No changes needed
    try {
      const response = await fetch(`${this.BASE_URL}/analysis/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete analysis');
      }
      return await response.json();
    } catch (error) {
      console.error('Delete Analysis Error:', error);
      throw error;
    }
  }

  static async exportAnalyses(analysisIds) {
    // No changes needed
    try {
      const response = await fetch(`${this.BASE_URL}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to export analyses');
      }

      const data = await response.json();

      // Create and download export file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strategic-analysis-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return data;
    } catch (error) {
      console.error('Export Analyses Error:', error);
      throw error;
    }
  }

  static async compareAnalyses(analysisId1, analysisId2) {
    // No changes needed
    try {
      const response = await fetch(`${this.BASE_URL}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisId1, analysisId2 }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare analyses');
      }

      return await response.json();
    } catch (error) {
      console.error('Compare Analyses Error:', error);
      throw error;
    }
  }
}
