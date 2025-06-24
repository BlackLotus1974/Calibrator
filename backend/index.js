// backend/index.js

const express = require('express');
const cors = require('cors');
const multer = require('multer'); // For handling multipart/form-data
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_API_KEY = process.env.FRONTEND_API_KEY;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS (configure as needed)
app.use(cors());

// Middleware to validate x-api-key from frontend
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== FRONTEND_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the /api/analyze endpoint
app.post('/analyze', upload.fields([
  { name: 'methodology', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 10 },
]), async (req, res) => {
  try {
    const { analysisType, inputData } = JSON.parse(req.body.inputData);
    const missionStatement = inputData.missionStatement;
    const strategicText = inputData.strategicText;

    // Access uploaded files
    const methodologyFile = req.files['methodology'] ? req.files['methodology'][0] : null;
    const additionalDocuments = req.files['additionalDocuments'] || [];

    // TODO: Implement your analysis logic here using the provided data and files
    // For demonstration, we'll return a mock response

    const mockResponse = {
      content: {
        analysisType,
        missionStatement,
        strategicText,
        methodologyFile: methodologyFile ? methodologyFile.originalname : 'None',
        additionalDocuments: additionalDocuments.map(file => file.originalname),
        results: 'This is a mock analysis result.',
      },
    };

    res.json(mockResponse);
  } catch (error) {
    console.error('Error during analysis:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
