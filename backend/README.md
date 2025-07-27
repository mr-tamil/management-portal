# Service Dashboard Backend

Backend server for the Service Dashboard application with Supabase integration.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (not anon key!)
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/deactivate` - Deactivate user (admin only)
- `POST /api/users/:userId/services/:serviceId/access` - Grant service access (admin only)

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service

### Health Check
- `GET /api/health` - Server health status

## Authentication

All endpoints (except health check) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Admin-only endpoints also require the user to have admin role in at least one service.

## Error Handling

The API returns consistent error responses:
```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

## Logging

The server logs all requests and errors to the console. In production, consider using a proper logging solution.