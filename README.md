# TaskFlow — Team Task Manager

A full-stack web application for managing team projects, assigning tasks, and tracking progress with role-based access control.

## Live Demo
> 🔗 Add your Railway URL here after deployment

## Features
- JWT Authentication (Signup/Login with Admin/Member roles)
- Project creation and team management
- Task creation, assignment, priority and status tracking
- Kanban board (To Do / In Progress / Done)
- Dashboard with stats, overdue alerts, recent activity

## Tech Stack
- **Backend:** Node.js + Express + sql.js (SQLite)
- **Frontend:** React 18 + Vite + React Router
- **Auth:** JWT + bcryptjs
- **Deployment:** Railway

## Run Locally

```bash
# Backend
cd backend
npm install
npm run dev   # runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev   # runs on http://localhost:5173
```

## Deploy to Railway
1. Push this repo to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select this repo
4. Add environment variables:
   - `JWT_SECRET` = any long random string
   - `NODE_ENV` = production
5. Deploy — Railway uses railway.toml automatically

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register |
| POST | /api/auth/login | Login |
| GET | /api/projects | List projects |
| POST | /api/projects | Create project (Admin) |
| GET | /api/projects/:id | Project details |
| POST | /api/projects/:id/members | Add member |
| GET | /api/projects/:id/tasks | List tasks |
| POST | /api/projects/:id/tasks | Create task |
| PUT | /api/projects/:id/tasks/:tid | Update task |
| GET | /api/dashboard | Dashboard stats |
