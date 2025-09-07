# Next.js to Vite + Express Migration Guide

## Overview
This guide converts the Administration Next.js application into separate frontend (Vite + React) and backend (Express.js) applications while maintaining all existing functionality.

## New Project Structure

```
administration/
├── frontend/                    # Vite React application
│   ├── public/
│   │   ├── vite.svg
│   │   └── index.html
│   ├── src/
│   │   ├── components/          # React components (moved from src/components)
│   │   ├── hooks/              # React hooks (moved from src/hooks)
│   │   ├── pages/              # Page components (converted from app/)
│   │   ├── services/           # API client (updated for Express backend)
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   ├── lib/                # Supabase client (frontend only)
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # Vite entry point
│   │   └── index.css           # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── tsconfig.json
├── backend/                     # Express.js server
│   ├── src/
│   │   ├── routes/             # Express routes (converted from app/api)
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── services/
│   │   │   └── service-roles/
│   │   ├── middleware/         # Express middleware
│   │   ├── utils/              # Server utilities
│   │   ├── lib/                # Supabase admin client
│   │   └── app.ts              # Express app setup
│   ├── package.json
│   ├── tsconfig.json
│   └── server.ts               # Server entry point
├── supabase/                   # Database migrations (unchanged)
│   └── migrations/
├── shared/                     # Shared types and utilities
│   ├── types/
│   └── utils/
└── README.md
```

## Migration Steps

### Step 1: Create Frontend (Vite) Application
### Step 2: Create Backend (Express) Application  
### Step 3: Move and Convert Components
### Step 4: Convert API Routes to Express Routes
### Step 5: Update Configuration and Dependencies
### Step 6: Test and Deploy

## Development Setup

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Backend Development
```bash
cd backend
npm install
npm run dev  # Runs on http://localhost:3001
```

### Full Stack Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## Key Changes Summary

1. **Frontend**: Next.js → Vite + React with client-side routing
2. **Backend**: Next.js API routes → Express.js server
3. **Authentication**: Supabase client-side auth with Express middleware
4. **API Communication**: Direct API calls to Express server
5. **Build Process**: Separate build processes for frontend and backend
6. **Deployment**: Can deploy frontend and backend independently

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001/api
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```