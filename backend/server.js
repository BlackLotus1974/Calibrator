import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import fse from 'fs-extra';

// __filename/__dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
// Ensure this path is correct relative to where the script is run
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('ENV path:', envPath, 'exists?', fs.existsSync(envPath));
if (fs.existsSync(envPath)) {
  console.log('ENV contents:\n', fs.readFileSync(envPath, 'utf8'));
} else {
  console.log('ENV file not found, using environment variables from deployment platform');
}

// Verify if the key is loaded immediately after config
console.log('Attempting to load GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded' : 'Not Loaded');
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY not found in environment variables. Check your .env file and path.");
  // Optionally exit if the key is absolutely required at startup,
  // although the check within the endpoint might be sufficient.
  // process.exit(1);
}

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import PQueue from 'p-queue';
import fetch from 'node-fetch'; // Still needed? Maybe not if only using Gemini SDK
import multer from 'multer';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, Paragraph, HeadingLevel, Packer, TextRun } from 'docx';

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit on unhandled exceptions
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit on unhandled rejections
});

// Directory setup
// Use the Vercel /tmp directory for uploads in production, otherwise use local directory
const isVercel = process.env.VERCEL_URL;
const UPLOAD_DIR = isVercel ? join(os.tmpdir(), 'uploads') : join(__dirname, 'uploads');
const METHODOLOGY_DIR = join(UPLOAD_DIR, 'methodology');
const ADDITIONAL_DOCS_DIR = join(UPLOAD_DIR, 'additional-documents');

// Ensure directories exist
fse.ensureDirSync(UPLOAD_DIR);
fse.ensureDirSync(METHODOLOGY_DIR);
fse.ensureDirSync(ADDITIONAL_DOCS_DIR);

// Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Constants
const CHARACTER_LIMITS = { fundamentals: 400 };

// Prompts (Keep your specific prompts here)
const prompts = {
  fundamentals: `You are an AI assistant specialized in providing comprehensive strategic analyses. Based on the provided strategic text and additional documents, generate detailed insights and recommendations to enhance organizational performance. Ensure the output is a JSON object.`,
  strategy: `Analyze the strategic text and additional content to formulate effective strategies that align with the organization's goals and market dynamics. Ensure the output is a JSON object.`,
  insights: `Extract and elaborate on key insights from the strategic text and supplementary documents to inform decision-making and strategic planning. Ensure the output is a JSON object.`,
  challengeAnalysis: `Analyze the provided strategic text, methodology, and additional content to generate a summary and 10 insightful points addressing the core challenges. Ensure the output is a JSON object structured like: {"summary": "...", "challenges": [{"point": "...", "explanation": "..."}, ...]}.`,
  strategicCalibration: `Evaluate the strategic text, considering any provided methodology and documents, to calibrate strategies ensuring alignment with organizational objectives and market conditions. Produce recommendations. Ensure the output is a JSON object.`,
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Needed for form data if not using JSON exclusively

// CORS
const allowedOriginsFromEnv = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', ...allowedOriginsFromEnv];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like server-to-server, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow Vercel deployment URLs
      if (origin && origin.includes('.vercel.app')) return callback(null, true);
      console.warn(`CORS blocked for origin: ${origin}`); // Log blocked origins
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // Removed 'anthropic-version'
  })
);
// Pre-flight requests
app.options('*', cors()); // Enable pre-flight across the board

// Rate limiting options
const rateLimitOptions = {
   windowMs: 60 * 1000,   // 1 minute
   max: 30,               // 30 requests / window
   message: { error: 'Too many requests…' },
   standardHeaders: true,
   legacyHeaders: false,
};
 const apiLimiter = rateLimit(rateLimitOptions);
app.use('/api/analyze', apiLimiter); // Apply rate limiting to the analyze endpoint

console.log(`Rate Limit: ${rateLimitOptions.max} reqs per ${rateLimitOptions.windowMs/1000}s`);


// Multer config using disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destDir;
    if (file.fieldname === 'methodology') {
      destDir = METHODOLOGY_DIR;
      // Clean out old methodology file before saving new one
      fse.emptyDirSync(destDir);
    } else if (file.fieldname === 'additionalDocuments') {
      destDir = ADDITIONAL_DOCS_DIR;
    } else {
      return cb(new Error('Unexpected file fieldname'), null);
    }
    fse.ensureDirSync(destDir); // Ensure directory exists
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    if (file.fieldname === 'methodology') {
      cb(null, 'current-methodology.docx'); // Always overwrite
    } else {
      // Create a unique filename for additional documents
      const timestamp = Date.now();
      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
      cb(null, `${timestamp}-${sanitizedOriginalName}`);
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if ((file.fieldname === 'methodology' || file.fieldname === 'additionalDocuments') && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type. Only .docx files are allowed.'), false); // Reject the file
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit per file
});

// API key middleware (Simple shared secret)
const FRONTEND_API_KEY = process.env.FRONTEND_API_KEY;
if (!FRONTEND_API_KEY) {
    console.warn("WARN: FRONTEND_API_KEY is not set. API endpoints might be unprotected.");
}

app.use((req, res, next) => {
  // Skip API key check for health check endpoint
  if (req.path === '/api/health') {
    return next();
  }
  // Only enforce if FRONTEND_API_KEY is set
  if (FRONTEND_API_KEY && req.headers['x-api-key'] !== FRONTEND_API_KEY) {
     console.warn(`Invalid API key attempt from ${req.ip}. Key: ${req.headers['x-api-key']}`);
     return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// Custom Error class for API errors
class APIError extends Error {
  constructor(message, status = 500, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'APIError'; // Optional: Set error name
  }
}

// Helper Functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Basic text highlighting (example) - adapt if needed
function highlightText(text) {
  // Example: Replace markdown-like bold syntax
  return text.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:bold;">$1</strong>');
}

// Function to get the base system prompt for a given analysis type
async function getSystemPrompt(sectionType) {
  // Return the prompt defined earlier, trimming whitespace
  return (prompts[sectionType] || '').trim();
}


// --- Prompt Formatting Functions ---

// Note: These need your specific detailed instructions for the AI.
// They should incorporate the input text and any file contents.

async function formatChallengeAnalysisPrompt(inputData, methodologyContent, additionalContent) {
    const { strategicText } = inputData;
    if (!strategicText || !strategicText.trim()) {
        throw new APIError('Strategic text is required for Challenge Analysis', 400);
    }
    const systemPrompt = await getSystemPrompt('challengeAnalysis'); // Use the defined prompt
    const sanitizedStrategicText = strategicText.replace(/Human:|Assistant:/gi, '').trim();
    // const processedStrategicText = highlightText(sanitizedStrategicText); // Optional highlighting

    // Construct the prompt using variables
    const prompt = `Human: 
${systemPrompt}

You are a strategic consultant AI analyzing exclusively the specific CHALLENGEs described in the strategic text below. Your analysis must focus the SPECIFIC CHALLENGE described in the text below. You are to perform the following analysis based on the provided strategic text and uploaded content.
Do not produce a generic or superficial analysis. Focus only on the text in the strategic text box and the uploaded document, referencing it in your final output. You must provide an answer, you must read the text and articulate the challenge show how to address the challenge. In every section, quote from or directly reference the lines in the text. 

Provide comprehensive analysis with:
    - Minimum 3 paragraphs per explanation
    - Specific examples from the text
    - Detailed implementation suggestions
    - Connection to broader context

Methodology Document Content:
${methodologyContent || 'None provided.'}

Additional Documents Content:
${additionalContent || 'None provided.'}

Strategic Text:
${sanitizedStrategicText}

Instructions: Provide a challenge-focused strategic analysis with these sections in valid JSON format only. Do not include any text before or after the JSON object. **Adhere strictly to the 10-item total limit.**

1.  **Opportunities**: Provide **up to 5** opportunities derived from the text and context.
    *   For each item, provide ONLY:
        *   A concise \`headline\`.
        *   A core \`explanation\` (minimum 3 sentences or ~50 words).
        *   Optional further \`detail\` if necessary.

2.  **Core_Strategic_Insights**: Provide **up to 5** core strategic insights derived from the text and context.
    *   For each item, provide ONLY:
        *   A concise \`headline\`.
        *   A core \`explanation\` summarizing ideas (minimum 3 sentences or ~50 words).
        *   Optional further \`detail\` if necessary.
    *   **Do NOT include a \`type\` field.**
    *   **IMPORTANT:** Do not include the literal words "headline" or "explanation" within the text value of the fields.

Assistant, respond with valid JSON only following this structure example (ensure total items <= 10):
{
  "Opportunities": [
    {
      "headline": "Opportunity 1 Headline Text",
      "explanation": "Explanation text (min 3 sentences / ~50 words)... (Do not start with 'Explanation:')"
      // No 'detail' field
    }
    // ... up to 5 opportunities
  ],
  "Core_Strategic_Insights": [
    { // Note: No 'type' or 'detail' field here
      "headline": "Insight 1 Headline Text",
      "explanation": "Explanation text (min 3 sentences / ~50 words)... (Do not start with 'Explanation:')"
    }
    // ... up to 5 insights
  ]
  // Ensure the total number of opportunities + insights does not exceed 10.
}
`; // End of template literal

    console.log('Constructed Challenge Analysis Prompt snippet:', prompt.substring(0, 500) + '...'); // Log snippet
    return prompt;
}

async function formatStrategicCalibrationPrompt(inputData, methodologyContent, additionalContent) {
  let { strategicText } = inputData;
  // strip out any "Line X" footnotes
  strategicText = strategicText.replace(/\bLine\s*\d+\b/g, '').trim();

  const systemPrompt = await getSystemPrompt('strategicCalibration');
  const sanitizedStrategicText = strategicText.replace(/Human:|Assistant:/gi, '').trim();

  const prompt = `Human:
  ${systemPrompt}

You are a strategic consultant AI working exclusively for the specific organization mentioned in the strategic text. You will be analyzing a SPECIFIC CHALLENGE or Challenges faced by the organization described in the text below.
Do not produce a generic or superficial analysis. If the text includes any specific challenge, you must show how the organization may address it. 
Focus only on the text below, referencing it in your final output. 
In every section, quote from or directly reference the lines in the text. 
Do NOT ignore the unique value proposition as stated.

Methodology Document Content:
${methodologyContent || 'None provided.'}

Additional Documents Content:
${additionalContent || 'None provided.'}

Strategic Text:
${sanitizedStrategicText}

Instructions: Return a single JSON object with these keys only (no extra fields, no labels "headline" or "explanation"):

1. Background/Context: 
   -    Identify the SPECIFIC organizational unit being discussed
   -    Provide no more than 5 sentences and 90 words. 
   Identify the SPECIFIC organizational unit being discussed
   - Cite the challenge(s) if applicable.

2. Vision / Desired Reality: 
   - Describe the desired reality within 5 years if the organization is successful. Strong vision statement, Future-oriented perspective.
   - Use the organization's OWN language and vision if appears in the text
   - Keep focus on the specific unit's desired outcomes and long-term aspirational goals
   - Maintain direct connection to stated goals

3. Mission:
   - What should the organization seek to do to serve the vision? What is the bold role of the organization?
   - Extract and analyze the SPECIFIC role described in the text
   - Focus on the unit's unique mandates and responsibilities
   - Avoid generic organizational statements
   - Write at least 4 sentences that derive from the text, use the organization's own language.

4. Strategy:
   - Provide 8 key insights with detailed explanations.
   - Each object must have exactly two properties:
       • "insight": your bold-style headline (do NOT include the word "Insight").
       • "implication": a 2 or 3 sentence description.


5. Values:
   - What are the values that guide and inspire the organization? Provide 4 unique value propositions.
   - List ONLY values explicitly mentioned or strongly implied

6. Unique Value Proposition:
   - What is the unique value proposition of the organization? What features make it unique and irreplaceable? Provide 4 unique value propositions.
   - List ONLY value propositions explicitly mentioned or strongly implied
   - Reference specific capabilities, assets, or advantages mentioned
   - Identify unique aspects that differentiate this unit.

7. Immediate Actions:
   - What immediate actions are needed? Come up with Clear Objectives and Scope,detailed task breakdown.

9. Success Metrics:
   - How will progress be measured?
   - What are the key indicators of success?

10. Structure:
   - Come up with 1 to 3 insights in regards to a better alignment of the organization with the challenge  



   IMPORTANT: 
   - Do NOT make generic statements about organizational strategy
   - Use the organization's own terminology and framing
   - Do NOT emit any other arrays/fields called "explanation", "headline" or similar.  Do NOT wrap in markdown or add commentary.

Assistant, respond with valid JSON only.
`; // End of template literal

    console.log('Constructed Strategic Calibration Prompt snippet:', prompt.substring(0, 500) + '...'); // Log snippet
    return prompt;
}

// Function to format generic prompts
async function formatGenericPrompt(sectionType, inputData) {
    const { strategicText } = inputData;
    if (!strategicText || !strategicText.trim()) {
        throw new APIError(`Strategic text is required for ${sectionType} analysis`, 400);
    }
    const systemPrompt = await getSystemPrompt(sectionType);
    const sanitizedStrategicText = strategicText.replace(/Human:|Assistant:/gi, '').trim();
    // const processedStrategicText = highlightText(sanitizedStrategicText); // Optional

    // IMPORTANT: Instruct the AI to return JSON.
    const basePrompt = `Human: 
${systemPrompt}

Strategic Text:
${sanitizedStrategicText}

Instructions: Generate the ${sectionType} analysis based on the text provided. Return the result as a JSON object only, following this structure example:
{
  "${sectionType}": "Your ${sectionType}..."
}

Assistant:
`; // End of template literal

    console.log(`Constructed Generic Prompt (${sectionType}) snippet:`, basePrompt.substring(0, 500) + '...'); // Log snippet
    return basePrompt;
}


// --- Queue Configuration ---
const QUEUE_CONFIG = {
  concurrency: 1,      // Process one API call at a time
  interval: 60000,     // 1 minute interval
  intervalCap: 3,      // Max 3 calls per interval (adjust based on Gemini TPM limits)
  timeout: 180000,     // Timeout for each task (3 minutes)
  throwOnTimeout: true // Throw error if task times out
};
const queue = new PQueue(QUEUE_CONFIG);

// Queue manager function with retries for rate limiting (429)
async function queuedApiCall(fn, jobId, retries = 3) {
  console.log(`[Queue ${jobId}] Adding task to queue.`);
  return queue.add(async () => {
    console.log(`[Queue ${jobId}] Starting task.`);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await fn();
        console.log(`[Queue ${jobId}] Task completed successfully on attempt ${attempt}.`);
        return result; // Success
      } catch (error) {
        console.error(`[Queue ${jobId}] Error on attempt ${attempt}:`, error.status, error.message);
        // Check if it's a rate limit error (429) or potentially a timeout that needs retry
        // Gemini might return different status codes, check documentation if needed.
        // Let's assume 429 is the primary retryable status code for now.
        if (error.status === 429 && attempt < retries) {
          const waitTime = Math.pow(2, attempt -1) * 15000; // Exponential backoff starting at 15s
          console.log(`[Queue ${jobId}] Rate limited (429). Waiting ${waitTime}ms before retry ${attempt + 1}/${retries}.`);
          await delay(waitTime);
        } else {
           console.error(`[Queue ${jobId}] Non-retryable error or max retries reached.`);
           throw error; // Re-throw non-retryable errors or after max retries
        }
      }
    }
    // This part should ideally not be reached if the loop throws correctly, but added for safety.
    console.error(`[Queue ${jobId}] Max retries reached after rate limiting.`);
    throw new APIError('Max retries reached due to persistent rate limiting', 429);
  });
}


// --- Input Validation Middleware ---
const validateAnalysisInput = (req, res, next) => {
  const { analysisType, inputData } = req.body;

  if (!analysisType) {
    return next(new APIError('Analysis type is required', 400));
  }
  if (!inputData || typeof inputData !== 'object') {
    return next(new APIError('Input data is required and must be an object', 400));
  }

  // Validate strategic text length if it exists and is not empty
  if (inputData.strategicText && typeof inputData.strategicText === 'string' && inputData.strategicText.trim().length < 150) {
    return next(new APIError('Strategic text must be at least 150 characters if provided', 400));
  }

  // Validate analysis type
  const validAnalysisTypes = ['fundamentals', 'strategy', 'insights', 'challenge-analysis', 'strategic-calibration'];
  if (!validAnalysisTypes.includes(analysisType)) {
    return next(new APIError('Invalid analysis type provided', 400));
  }

  // Specific validation for types requiring strategic text
  if (['challenge-analysis', 'strategic-calibration', 'fundamentals', 'strategy', 'insights'].includes(analysisType)) {
     if (!inputData.strategicText || !inputData.strategicText.trim()) {
        return next(new APIError(`Strategic text is required for ${analysisType}`, 400));
     }
  }

  // Add more specific validations if needed (e.g., check for mission statement if required)

  next(); // Validation passed
};

// Utility function to extract JSON block from AI response (Handles potential markdown fences)
function extractJsonFromText(str) {
  if (!str || typeof str !== 'string') return null;

  // Look for JSON within ```json ... ``` fences
  const fencedMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
  if (fencedMatch && fencedMatch[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch (e) {
      console.warn('Failed to parse JSON within fences, falling back to direct search.');
      // Fall through to try parsing the whole string or finding the first '{'
    }
  }

  // Look for the first '{' and last '}'
  const startIndex = str.indexOf('{');
  const endIndex = str.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      return null; // No valid JSON structure found
  }

  const jsonStr = str.substring(startIndex, endIndex + 1);
  try {
    const parsedContent = JSON.parse(jsonStr);
    return parsedContent;
  } catch (err) {
    console.error('Failed to parse JSON from extracted text:', err);
    // console.log("Original string for debugging:", str); // Optional: Log the string that failed parsing
    return null; // Return null if parsing fails
  }
}


// --- API Endpoints ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), node_version: process.version });
});

// Get Current Methodology Status
app.get('/api/methodology/current', async (req, res, next) => {
  try {
    const methodologyPath = join(METHODOLOGY_DIR, 'current-methodology.docx');
    if (fse.existsSync(methodologyPath)) {
      const stats = fse.statSync(methodologyPath);
      return res.json({
        methodology: {
          name: 'current-methodology.docx',
          uploadDate: stats.mtime, // Last modified time
          size: stats.size,
          custom: true
        }
      });
    }
    // No methodology file found
    res.json({ methodology: null });
  } catch (error) {
    console.error('Error checking methodology status:', error);
    next(new APIError('Failed to retrieve methodology status', 500));
  }
});


// Main Analysis Endpoint
app.post(
  '/api/analyze',
  upload.fields([
    { name: 'methodology', maxCount: 1 },
    { name: 'additionalDocuments', maxCount: 10 }, // Allow up to 10 additional docs
  ]),
  // Middleware to parse inputData if sent as stringified JSON (common with FormData)
  (req, res, next) => {
    if (req.body.inputData && typeof req.body.inputData === 'string') {
      try {
        req.body.inputData = JSON.parse(req.body.inputData);
      } catch (error) {
        return next(new APIError('Invalid JSON format in inputData field', 400));
      }
    }
    next();
  },
  validateAnalysisInput, // Apply validation middleware
  async (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Received /api/analyze request for type: ${req.body.analysisType}`);
    const { analysisType, inputData } = req.body;
    const jobId = `${analysisType}-${Date.now()}`;

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error("GEMINI_API_KEY is not configured in the environment.");
      return next(new APIError('API key is not configured on the server.', 500));
    }

    // Initialize Gemini Client (do this inside the request if key could change, or outside if static)
    let genAI, model;
    try {
        genAI = new GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest' });
        console.log(`Using Gemini model: ${process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest'}`);
    } catch (initError) {
        console.error("Failed to initialize GoogleGenerativeAI:", initError);
        return next(new APIError('Failed to initialize AI service.', 500));
    }


    try {
      let prompt;
      let methodologyContent = '';
      let additionalContent = '';

      // --- File Content Extraction (Common Logic) ---
      try {
          const methodologyFile = req.files?.['methodology']?.[0];
          const additionalFiles = req.files?.['additionalDocuments'] || [];

          if (methodologyFile) {
              console.log(`Reading methodology file: ${methodologyFile.path}`);
              methodologyContent = await mammoth.extractRawText({ path: methodologyFile.path })
                                               .then(result => result.value)
                                               .catch(err => { throw new Error(`Failed reading methodology: ${err.message}`); });
          }

          if (additionalFiles.length > 0) {
              console.log(`Reading ${additionalFiles.length} additional document(s)...`);
              for (const file of additionalFiles) {
                   console.log(`Reading additional file: ${file.path}`);
                   const content = await mammoth.extractRawText({ path: file.path })
                                               .then(result => result.value)
                                               .catch(err => { throw new Error(`Failed reading additional doc (${file.originalname}): ${err.message}`); });
                   additionalContent += `\\n\\n--- Document: ${file.originalname} ---\\n${content}`; // Add separator
              }
          }
      } catch (fileReadError) {
          console.error('Error reading uploaded file(s):', fileReadError);
          // It might be okay to continue without file content, depending on requirements,
          // or throw an error. Let's throw for now.
          return next(new APIError(`Failed to read uploaded document: ${fileReadError.message}`, 500));
      }
      // --- End File Content Extraction ---


      // --- Prompt Formatting (Specific Logic) ---
      if (analysisType === 'challenge-analysis') {
        prompt = await formatChallengeAnalysisPrompt(inputData, methodologyContent, additionalContent);
      } else if (analysisType === 'strategic-calibration') {
        prompt = await formatStrategicCalibrationPrompt(inputData, methodologyContent, additionalContent);
      } else {
        // Generic types might not use file content, adjust formatGenericPrompt if they should
        prompt = await formatGenericPrompt(analysisType, inputData);
      }

      // --- API Call via Queue ---
      console.log(`[${jobId}] Queuing Gemini API call.`);
      const response = await queuedApiCall(
        async () => {
          console.log(`[${jobId}] Executing Gemini API call.`);
          try {
            const generationConfig = {
              temperature: 0.5, // Adjust creativity vs. factuality
              // maxOutputTokens: 8192, // Example: Set max output tokens if needed
              responseMimeType: 'application/json', // Crucial: Instruct Gemini to respond in JSON
            };

            const result = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: generationConfig,
            });

            const apiResponse = result.response;

            // --- Robust Response Checking ---
             if (!apiResponse) {
                 console.error(`[${jobId}] Gemini API Error: No response object.`);
                 throw new APIError('Invalid response structure from Gemini API (no response).', 500);
             }
             if (apiResponse.promptFeedback?.blockReason) {
                 console.error(`[${jobId}] Gemini API Blocked: ${apiResponse.promptFeedback.blockReason}`, apiResponse.promptFeedback);
                 throw new APIError(`Content blocked by API: ${apiResponse.promptFeedback.blockReason}`, 400, apiResponse.promptFeedback);
             }
            if (!apiResponse.candidates || apiResponse.candidates.length === 0) {
              console.error(`[${jobId}] Gemini API Error: No candidates in response.`, apiResponse);
              throw new APIError('Invalid response structure from Gemini API (no candidates).', 500, apiResponse);
            }

            const candidate = apiResponse.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0 || !candidate.content.parts[0].text) {
              console.error(`[${jobId}] Gemini API Error: Missing or invalid text content in candidate.`, candidate?.content);
              throw new APIError('Missing or invalid text content in Gemini API response.', 500, apiResponse);
            }
            // --- End Robust Response Checking ---

            console.log(`[${jobId}] Gemini API call successful.`);
            return { completion: candidate.content.parts[0].text }; // Return the text containing JSON

          } catch (apiCallError) {
            console.error(`[${jobId}] Error during Gemini API call execution:`, apiCallError);
            // Enrich the error or re-throw specific types
             if (apiCallError instanceof APIError) throw apiCallError;

             let statusCode = 500;
             let message = 'Failed to call analysis API.';
              // Check for specific Google AI SDK error properties if available
              if (apiCallError.message) {
                 message = apiCallError.message;
             }
             // You might check apiCallError.status or apiCallError.code if they exist
             throw new APIError(message, statusCode, apiCallError); // Throw as APIError for consistent handling
          }
        },
        jobId // Pass job ID for logging within the queue function
      ); // End queuedApiCall

      // --- Process Response ---
      console.log(`[${jobId}] Received response from API call.`);
      // Attempt to parse the JSON completion text
      const extractedJson = extractJsonFromText(response.completion);

      if (extractedJson) {
         console.log(`[${jobId}] Successfully extracted JSON from response.`);
         res.json({
           content: extractedJson, // Send parsed JSON
           analysisId: jobId,
         });
      } else {
         // If JSON extraction fails, decide how to handle it.
         // Option 1: Return the raw text (might break frontend if it expects JSON)
         // Option 2: Return an error
         console.warn(`[${jobId}] Failed to extract JSON from the API response. Returning raw text.`);
         // console.log("Raw completion text:", response.completion); // For debugging
         // Let's return raw text for now, but maybe an error is better long-term
         res.json({
           content: response.completion, // Send raw text as fallback
           analysisId: jobId,
           warning: "Could not parse JSON from response, returning raw text."
         });
         // // Option 2: Return Error
         // throw new APIError("Failed to parse the analysis result from the AI.", 500, {rawResponse: response.completion});
      }

    } catch (error) {
       console.error(`[${jobId}] Error in /api/analyze handler:`, error);
       // Ensure the error is passed to the central error handler
       next(error instanceof APIError ? error : new APIError(error.message || 'An unexpected error occurred during analysis.', 500));
    }
  } // End async (req, res, next) handler
); // End app.post('/api/analyze')


// Export Endpoint (Generate Word Document)
app.post('/api/export', async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received /api/export request.`);
  try {
    const { analysisResults, analysisType } = req.body; // analysisType might be useful for title/structure

    if (!analysisResults) {
      throw new APIError('No analysis results provided for export', 400);
    }

    let parsedResults;
    // Ensure results are an object, parsing if necessary
    if (typeof analysisResults === 'string') {
        console.log("Attempting to parse string analysisResults for export.");
        parsedResults = extractJsonFromText(analysisResults);
        if (!parsedResults) {
           console.warn("Could not parse analysisResults string as JSON for export, using as plain text.");
           // Fallback: create a simple object if parsing fails
           parsedResults = { "Analysis Results": analysisResults };
        }
    } else if (typeof analysisResults === 'object' && analysisResults !== null) {
        parsedResults = analysisResults; // Already an object
    } else {
        throw new APIError('Invalid format for analysis results provided', 400);
    }

    // Create document content using the helper function
    const docChildren = buildDocxContent(parsedResults, 0);

    // Define document styles (can be extended)
    const doc = new Document({
      styles: {
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', run: { size: 36, bold: true, color: '333333' }, paragraph: { spacing: { before: 400, after: 200 } } },
          { id: 'Heading2', name: 'Heading 2', run: { size: 32, bold: true, color: '444444' }, paragraph: { spacing: { before: 300, after: 150 } } },
          { id: 'Normal', name: 'Normal', run: { size: 24, color: '555555' }, paragraph: { spacing: { before: 120, after: 120 } } }
        ]
      },
      sections: [{
        properties: {}, // Add section properties if needed (e.g., margins)
        children: [
          new Paragraph({
         // Always use your custom title
           text: 'Challenge Analysis: Yallah, Walla Sababa',
            heading: HeadingLevel.TITLE, // Or HEADING_1
            alignment: 'center',
            spacing: { after: 400 },
          }),
          ...docChildren // Add the generated content
        ]
      }]
    });

    // Generate buffer
    console.log("Generating DOCX buffer...");
    const buffer = await Packer.toBuffer(doc);
    console.log("DOCX buffer generated successfully.");

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="strategic-analysis-${analysisType || 'export'}-${Date.now()}.docx"`);
    res.setHeader('Content-Length', buffer.length);

    // Send the file
    res.send(buffer);

  } catch (error) {
    console.error('Error during /api/export:', error);
    next(error instanceof APIError ? error : new APIError(error.message || 'Failed to generate document', 500));
  }
});


// --- DOCX Content Builder Helper ---

// Recursive function to build DOCX Paragraphs from nested data
function buildDocxContent(data, depth = 0) {
  const paragraphs = [];
  const indentSize = depth * 360; // Indentation per level (in twentieths of a point)

  // Helper to create a styled paragraph
  const createStyledParagraph = (text, options = {}) => {
    return new Paragraph({
      children: [new TextRun({
        text: String(text), // Ensure text is a string
        bold: options.bold || false,
        size: options.size || 24, // Default size 12pt (24 half-points)
        color: options.color || '333333',
      })],
      indent: { left: options.indent === undefined ? indentSize : options.indent },
      bullet: options.bullet ? { level: depth % 9 } : undefined, // Cycle through bullet levels
      spacing: options.spacing || { before: 100, after: 100 }, // Default spacing
      heading: options.heading, // e.g., HeadingLevel.HEADING_1
      style: options.style, // e.g., 'Heading1'
      keepLines: true, // Try to keep paragraph lines together
    });
  };

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      if (item && typeof item === 'object') {
          // Special handling for { insight: '...', implication: '...' } structure
          if (item.insight && item.implication) {
             paragraphs.push(createStyledParagraph(item.insight, {
                bold: true,
                size: 26, // Slightly larger than normal text
                spacing: { before: 200, after: 50 },
                indent: indentSize + 360 // Indent these items
             }));
             paragraphs.push(createStyledParagraph(item.implication, {
                bullet: false, // No bullet for implication
                indent: indentSize + 360 // Keep same indentation
             }));
          }
          // Special handling for { headline: '...', explanation: '...' } structure
          else if (item.headline && item.explanation) {
             paragraphs.push(createStyledParagraph(item.headline, {
                bold: true,
                size: 26,
                spacing: { before: 200, after: 50 },
                indent: indentSize + 360 // Indent these items
             }));
             paragraphs.push(createStyledParagraph(item.explanation, {
                bullet: false, // No bullet for explanation
                indent: indentSize + 360 // Keep same indentation
             }));
          } else {
             // Generic object handling within an array - treat as sub-section or list item
             paragraphs.push(...buildDocxContent(item, depth + 1)); // Recurse for nested objects/arrays
          }
      } else if (typeof item === 'string') {
        // Simple string item in an array - treat as a bullet point by default
        paragraphs.push(createStyledParagraph(item, { bullet: true, indent: indentSize + 360 }));
      } else if (item !== null && item !== undefined) {
          // Handle other primitives (numbers, booleans)
          paragraphs.push(createStyledParagraph(String(item), { bullet: true, indent: indentSize + 360 }));
      }
    });
  } else if (data && typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      // Skip the "Immediate Actions" section entirely
      if (key === 'Immediate_Actions') { // Assuming the key is Immediate_Actions based on prompt wording
          console.log("Skipping 'Immediate_Actions' section for DOCX export.");
          return; // Skip this key-value pair
      }

      // Format the key as a heading (unless it's a special key like 'Analysis Results')
       if (key !== 'Analysis Results') { // Avoid adding this generic key as a heading
           const headingText = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // Title Case Key
            paragraphs.push(createStyledParagraph(headingText, {
                // Use H1 for top level, H2 for next level, Normal+Bold thereafter
                style: depth === 0 ? 'Heading1' : (depth === 1 ? 'Heading2' : undefined),
                bold: depth > 1 ? true : undefined, // Make deeper keys bold
                size: depth === 0 ? undefined : (depth === 1 ? undefined : 26), // Adjust size based on depth
                spacing: { before: 300, after: 100 },
                indent: indentSize
            }));
       }

      // Recursively handle the value
      if (value !== null && value !== undefined) {
          paragraphs.push(...buildDocxContent(value, depth + 1));
      } else {
           paragraphs.push(createStyledParagraph("(empty)", { indent: indentSize + 360, color: '888888' })); // Indicate empty value
      }
    });
  } else if (data !== null && data !== undefined) {
    // Handle primitive types (string, number, boolean) not inside an object/array directly
    paragraphs.push(createStyledParagraph(String(data), { indent: indentSize }));
  }

  return paragraphs;
}


// --- Central Error Handling Middleware ---
// This should be the LAST app.use() call
app.use((err, req, res, next) => {
  // Log the error internally
  console.error(`[${new Date().toISOString()}] Error occurred on ${req.method} ${req.path}:`, err);

  // Handle specific error types
  if (err instanceof APIError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof multer.MulterError) {
    let message = 'File upload error.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the 20MB limit.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
         message = 'Unexpected file field received.';
    }
    // Add other Multer codes as needed
    return res.status(400).json({
      error: message,
      details: { code: err.code, field: err.field },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle CORS errors explicitly caught earlier
   if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({
          error: 'Cross-Origin Request Blocked',
          message: 'This origin is not permitted to access the resource.',
          timestamp: new Date().toISOString(),
      });
  }

   // Handle JSON parsing errors from express.json()
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Invalid JSON',
            message: 'The request body could not be parsed as JSON.',
            timestamp: new Date().toISOString(),
        });
    }


  // Generic fallback for other errors
  res.status(500).json({
    error: 'Internal Server Error',
    // Provide more detail in development environment
    message: process.env.NODE_ENV === 'development' && err.message ? err.message : 'An unexpected error occurred on the server.',
    timestamp: new Date().toISOString(),
  });
});


// --- Start Server ---
// Start server
app.listen(PORT, () => {
  console.log('-------------------------------------------------------');
  console.log(` Backend Server running on http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV}`);
  console.log(` CORS allowing origins: ${allowedOrigins.join(', ')}`);
  console.log(` Uploads directory: ${UPLOAD_DIR}`);
  console.log(`Rate Limit: ${rateLimitOptions.max} reqs per ${rateLimitOptions.windowMs/1000}s per IP for /api/analyze`);
  console.log(` Queue: ${QUEUE_CONFIG.concurrency} concurrency, ${QUEUE_CONFIG.intervalCap} per ${QUEUE_CONFIG.interval}ms, timeout ${QUEUE_CONFIG.timeout}ms`);
  console.log('-------------------------------------------------------');
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed.');
    console.log('Server gracefully shut down.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Export for Vercel
export default app;
