// FILE: /src/services/api.js

const BACKEND_URL = import.meta.env.PROD ? '' : 'http://localhost:5000'; // Use relative path in production
const API_KEY = import.meta.env.VITE_FRONTEND_API_KEY; // Frontend API Key

export const ApiService = {
  async get(endpoint) {
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      headers: {
        'x-api-key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(`Error fetching ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  },

  async post(endpoint, data, isFormData = false) {
    // If this is an "analyze" call, append triple‐backtick instruction
    if (
      endpoint === 'analyze' &&
      !isFormData &&
      data &&
      (data.analysisType || data.sectionType) &&
      data.inputData
    ) {
      const tripleBacktickNote = `
IMPORTANT: Return your final answer in triple-backticks labeled \`json\`, for example:

\`\`\`json
{
  "exampleKey": "exampleValue"
}
\`\`\`
`;

      // Append to missionStatement or strategicText if present
      if (data.inputData.missionStatement) {
        data.inputData.missionStatement += `\n\n${tripleBacktickNote}`;
      } else if (data.inputData.strategicText) {
        data.inputData.strategicText += `\n\n${tripleBacktickNote}`;
      }
    }

    const headers = isFormData
      ? { 'x-api-key': API_KEY } // let browser set the multipart boundaries
      : {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        };

    const body = isFormData ? data : JSON.stringify(data);

    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error posting to ${endpoint}: ${errorText}`);
    }
    return await response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error putting to ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${BACKEND_URL}/api/${endpoint}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(`Error deleting ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  },
};
