# Strategic Calibrator

Strategic Calibrator is a strategic analysis tool designed to help organizations define and analyze their strategic fundamentals, including mission statements, strategies, insights, structure, economic factors, and new knowledge areas.

## Features

- **Section Selection:** Choose from various analysis sections to focus your strategic analysis.
- **Mission & Strategic Text Input:** Provide your organization's mission statement and strategic text for analysis.
- **File Upload:** Upload supporting documents to enrich your analysis.
- **Methodology Management:** Manage and upload custom methodologies for tailored analyses.
- **Progress Tracking:** Navigate through different steps of the analysis process seamlessly.
- **Error Handling:** Robust error handling to guide users through issues.

## Technologies Used

- **Frontend:**
  - React
  - Vite
  - Tailwind CSS
  - React Router
  - Lucide Icons

- **Backend:**
  - Express.js
  - Node.js
  - Multer for file uploads
  - Mammoth for processing `.docx` files
  - DOCX for generating Word documents
  - PQueue for managing API requests
  - Rate Limiting with `express-rate-limit`
  - CORS

## Getting Started

### Prerequisites

- **Node.js** (v14 or above)
- **Yarn** or **npm**

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/strategic-calibrator.git
   cd strategic-calibrator
