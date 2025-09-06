# Adminium - User Management System (Vite + Express)

A comprehensive user management system built with Vite (React), Express.js, TypeScript, and Supabase.

## Features

- **Complete User Management**: Create, delete, and manage users through secure API routes
- **Service-Based Access Control**: Assign users to services (Adminium, RMS Analysis) with role-based permissions
- **Secure Authentication**: Email/password login with Supabase Auth and Row Level Security
- **Performance Optimized**: Pagination, search, filtering, and React Query for efficient data management
- **Production Ready**: Comprehensive error handling, logging, and validation

## Architecture

This application uses a modern full-stack architecture with separate frontend and backend applications.

### Project Structure

```
frontend/                   # Vite React application
├── src/
│   ├── components/         # React components
│   ├── hooks/              # React hooks
│   ├── services/           # API client
│   ├── types/              # TypeScript types
│   ├── lib/                # Supabase client
│   └── utils/              # Utility functions
├── package.json
├── vite.config.ts
└── tailwind.config.js
backend/                    # Express.js server
├── src/
│   ├── routes/             # Express routes
│   ├── middleware/         # Express middleware
│   ├── utils/              # Server utilities
│   └── lib/                # Supabase admin client
├── package.json
└── tsconfig.json
shared/                     # Shared types and utilities
├── types/
└── utils/
```

### Frontend (`frontend/`)
- **Vite + React**: Fast development with React Router
- **Modular Components**: Application-specific components with shared UI library
- **Custom Hooks**: Specialized hooks for data management
- **Services**: Dedicated API clients for backend communication

### Backend (`backend/`)
- **Express.js**: RESTful API server
- **Middleware**: Authentication and security middleware
- **Utils**: Helper functions and logging utilities

### Database (`supabase/migrations/`) - Unchanged
- **Services**: Available services (Adminium, RMS Analysis)
- **Service Roles**: User-service associations with roles (admin/user)
- **Audit Logs**: Comprehensive activity tracking
- **RLS Policies**: Row-level security for data protection

## Setup Instructions

### 1. Environment Variables

#### Frontend
Copy `frontend/.env.example` to `frontend/.env`:
```bash
cd frontend
cp .env.example .env
```

#### Backend
Copy `backend/.env.example` to `backend/.env`:
```bash
cd backend
cp .env.example .env
```

Update both environment files with your Supabase project details.

### 2. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 3. Database Setup

1. Click the "Connect to Supabase" button in the top right to set up your Supabase project
2. The database migrations will create the necessary tables and security policies automatically

### 4. Development

#### Start Backend Server
```bash
cd backend
npm run dev  # Runs on http://localhost:3001
```

#### Start Frontend Development Server
```bash
cd frontend
npm run dev  # Runs on http://localhost:5173
```

The application will be available at `http://localhost:5173`.

### 5. Initial Admin Setup

After setup, you'll need to manually create an admin user in your Supabase dashboard:

1. Go to your Supabase dashboard → Authentication → Users
2. Create a new user with email/password
3. Go to the SQL Editor and run:
```sql
-- Get the Adminium service ID
SELECT id FROM services WHERE name = 'Adminium';

-- Insert admin role (replace the UUIDs with actual values)
INSERT INTO service_roles (user_id, service_id, role)
VALUES ('USER_ID_HERE', 'ADMINIUM_SERVICE_ID_HERE', 'admin');
```

## API Endpoints

All API endpoints are available at `http://localhost:3001/api/`:

### Users
- `GET /api/users` - Get paginated users with search
- `POST /api/users` - Create new user
- `DELETE /api/users/[userId]` - Delete user
- `POST /api/users/[userId]/reset-password` - Send password reset email
- `GET /api/users/[userId]/service-roles` - Get user's service roles

### Services
- `GET /api/services` - Get all services

### Service Roles
- `POST /api/service-roles` - Add user to service
- `DELETE /api/service-roles/[userId]/[serviceId]` - Remove user from service
- `PUT /api/service-roles/[userId]/[serviceId]` - Update user role

### Authentication
- `GET /api/auth/verify` - Verify user authentication and membership

### Logs
- `GET /api/logs` - Get paginated audit logs

## Development

### Frontend Development
```bash
cd frontend
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev     # Start development server with hot reload
npm run build   # Build TypeScript to JavaScript
npm start       # Start production server
```

### Full Stack Development
Run both frontend and backend simultaneously:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Security Features

- Row Level Security (RLS) policies on all database tables
- JWT-based authentication with Supabase
- Input validation and sanitization
- Comprehensive audit logging
- CORS protection and security headers
- Separate frontend and backend for better security isolation

## Performance Features

- React Query for efficient data caching
- Vite for fast development and optimized builds
- Pagination for large datasets
- Debounced search functionality
- Optimistic updates for better UX
- Proper loading states and error handling

## Deployment

### Frontend Deployment
Build the frontend for production:
```bash
cd frontend
npm run build
```
Deploy the `dist` folder to any static hosting service (Vercel, Netlify, etc.).

### Backend Deployment
Build and deploy the backend:
```bash
cd backend
npm run build
npm start
```
Deploy to any Node.js hosting service (Railway, Render, DigitalOcean, etc.).

## Migration from Next.js

This application was migrated from Next.js to Vite + Express architecture:

### Key Changes
1. **Frontend**: Next.js App Router → Vite + React Router
2. **Backend**: Next.js API routes → Express.js server
3. **Authentication**: Server-side auth → Client-side auth with API verification
4. **Build Process**: Single Next.js build → Separate frontend/backend builds
5. **Deployment**: Single deployment → Independent frontend/backend deployments

### Benefits
- **Faster Development**: Vite's lightning-fast HMR
- **Better Separation**: Clear frontend/backend boundaries
- **Flexible Deployment**: Deploy frontend and backend independently
- **Technology Choice**: Use different technologies for frontend/backend as needed
- **Scalability**: Scale frontend and backend independently

## Building for Production

### Frontend
```bash
cd frontend
npm run build
npm run type-check
```

### Backend
```bash
cd backend
npm run build
npm run type-check
```