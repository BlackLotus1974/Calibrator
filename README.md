# Strategic Calibrator

Strategic Calibrator is a strategic analysis tool designed to help organizations define and analyze their strategic fundamentals, including mission statements, strategies, insights, structure, economic factors, and new knowledge areas.

## Features

- **User Authentication:** Secure user registration and login with Supabase Auth
- **Section Selection:** Choose from various analysis sections to focus your strategic analysis
- **Mission & Strategic Text Input:** Provide your organization's mission statement and strategic text for analysis
- **File Upload:** Upload supporting documents to enrich your analysis with Supabase Storage
- **Methodology Management:** Manage and upload custom methodologies for tailored analyses
- **Progress Tracking:** Navigate through different steps of the analysis process seamlessly
- **Data Persistence:** Save and retrieve analyses with Supabase database
- **Real-time Updates:** Live data synchronization across sessions
- **Error Handling:** Robust error handling to guide users through issues

## Technologies Used

- **Frontend:**
  - React 18
  - Vite
  - Tailwind CSS
  - React Router
  - Lucide Icons
  - Supabase JS Client

- **Backend:**
  - Express.js
  - Node.js
  - Multer for file uploads
  - Mammoth for processing `.docx` files
  - DOCX for generating Word documents
  - PQueue for managing API requests
  - Rate Limiting with `express-rate-limit`
  - CORS

- **Database & Authentication:**
  - Supabase (PostgreSQL)
  - Row Level Security (RLS)
  - Supabase Auth
  - Supabase Storage

- **Deployment:**
  - Vercel (Frontend & Serverless Functions)
  - Supabase (Database & Authentication)

## Getting Started

### Prerequisites

- **Node.js** (v16 or above)
- **npm** or **yarn**
- **Supabase Account** (free tier available)
- **Vercel Account** (free tier available)

### Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/strategic-calibrator.git
   cd strategic-calibrator

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Supabase:**
   
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Run the SQL schema in the Supabase SQL Editor (copy from `supabase-schema.sql`)
   - Enable email authentication in Authentication > Settings

4. **Configure environment variables:**

   The project includes a `.env` template file. Update it with your Supabase credentials:

   **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project (or create a new one)
   - Go to Settings → API
   - Copy the "Project URL" and "anon/public" key

   **Update the `.env` file:**
   ```bash
   # Replace the placeholder values in .env:
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Note: The backend has its own `.env` file in the `backend/` directory with different configuration.

5. **Start the development server:**

   ```bash
   npm run dev
   ```

   This will start both the frontend (Vite) and backend (Express) servers concurrently.

6. **Open your browser:**

   Navigate to `http://localhost:5173` to see the application.

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub:**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project" and import your GitHub repository
   - Vercel will automatically detect it's a Vite project

3. **Configure environment variables in Vercel:**
   
   In your Vercel project settings, add these environment variables:
   
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   NODE_ENV=production
   ```

4. **Deploy:**
   
   Vercel will automatically build and deploy your application. Future pushes to the main branch will trigger automatic deployments.

### Using Vercel CLI (Alternative)

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Login and deploy:**

   ```bash
   vercel login
   vercel --prod
   ```

## Project Structure

```
strategic-calibrator/
├── src/
│   ├── components/          # React components
│   │   ├── Auth.jsx        # Authentication component
│   │   ├── Header.jsx      # Header with user info
│   │   └── ...             # Other components
│   ├── lib/
│   │   └── supabase.js     # Supabase client configuration
│   ├── services/
│   │   ├── api.js          # API service (existing backend)
│   │   ├── supabaseService.js  # Supabase service methods
│   │   └── ...             # Other services
│   └── ...
├── backend/                # Express.js backend
│   ├── server.js          # Main server file
│   └── ...
├── vercel.json            # Vercel configuration
├── supabase-schema.sql    # Database schema
└── ...
```

## Key Features Implementation

### Authentication Flow
- Users must sign up/sign in to access the application
- Session management with Supabase Auth
- Automatic token refresh
- Secure logout functionality

### Data Management
- All analyses are saved to Supabase with user association
- Row Level Security ensures users only see their own data
- Real-time synchronization across sessions
- Local storage as backup

### File Storage
- Document uploads handled by Supabase Storage
- User-specific file organization
- Secure access with RLS policies

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Backend server port | No |
| `OPENAI_API_KEY` | OpenAI API key (if using) | No |
| `GOOGLE_API_KEY` | Google API key (if using) | No |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

## Changelog

### v1.1.0 (Current)
- Added Supabase integration for authentication and data persistence
- Implemented user-specific data isolation with RLS
- Added file storage with Supabase Storage
- Configured Vercel deployment
- Enhanced security with proper authentication flow

### v1.0.0
- Initial release with basic strategic analysis functionality
- Local storage for data persistence
- Express.js backend for analysis processing
