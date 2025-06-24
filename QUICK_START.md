# Quick Start Guide - Strategic Calibrator

This guide will help you get the Strategic Calibrator up and running quickly with Supabase and Vercel.

## 🚀 Quick Setup (5 minutes)

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/strategic-calibrator.git
cd strategic-calibrator
npm install
```

### 2. Set up Supabase (2 minutes)

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and fill in project details
   - Wait for the project to be created (1-2 minutes)

2. **Get your credentials:**
   - Go to Settings > API
   - Copy your Project URL and anon/public key

3. **Run the database setup:**
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase-schema.sql` and run it
   - This creates all necessary tables and security policies

### 3. Configure Environment Variables
Create `.env.local` in your project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` and you're ready to go! 🎉

## 📱 First Steps in the App

1. **Sign Up:** Create your account with email and password
2. **Create Analysis:** Click "New Analysis" and input your strategic text
3. **View Results:** See your analysis results and save them
4. **Check History:** Use the "History" link to see all your saved analyses

## 🚀 Deploy to Production (3 minutes)

### Option 1: Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy with Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy"

### Option 2: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🔧 Key Features

- ✅ **User Authentication** - Secure signup/login with Supabase
- ✅ **Strategic Analysis** - AI-powered analysis of strategic documents
- ✅ **Data Persistence** - All analyses saved to your personal cloud database
- ✅ **File Upload** - Upload and analyze documents
- ✅ **Analysis History** - View and manage all your past analyses
- ✅ **Real-time Sync** - Data syncs across all your devices
- ✅ **Secure** - Row Level Security ensures your data is private

## 🛠️ Troubleshooting

### Common Issues:

**"Invalid API key" error:**
- Check your `.env.local` file has the correct Supabase credentials
- Make sure there are no extra spaces in your environment variables

**Database connection error:**
- Ensure you've run the SQL schema in Supabase
- Check your Supabase project is active (not paused)

**Build errors on Vercel:**
- Make sure all environment variables are set in Vercel dashboard
- Check that your build command is `npm run build`

### Need Help?
- Check the full [README.md](./README.md) for detailed instructions
- Open an issue on GitHub
- Check Supabase documentation at [supabase.com/docs](https://supabase.com/docs)

## 🎯 Next Steps

Once you have the basic setup running:

1. **Customize the Analysis:** Modify the analysis prompts in the backend
2. **Add More Features:** Extend the Supabase schema for additional data
3. **Enhance UI:** Customize the design with Tailwind CSS
4. **Add Integrations:** Connect with external APIs for enhanced analysis

Happy analyzing! 🚀 