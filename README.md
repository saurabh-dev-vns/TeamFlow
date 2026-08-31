# TeamFlow — Collaborative Project Management Platform

TeamFlow is a full-stack MERN application for small teams to manage projects and tasks: create projects, assign work, track progress on a drag-and-drop Kanban board, comment on tasks, and get real-time notifications — all backed by role-based authorization (Admin / Member).

---

## 1. Features

- **Authentication**: register, login, logout, JWT-based sessions, password hashing (bcrypt), persistent login, protected routes.
- **Role-based authorization**: enforced on the backend (not just hidden UI) — Admin vs Member permissions.
- **Projects**: full CRUD, status tracking, team member management, per-project progress stats.
- **Tasks**: full CRUD, priority & status, due dates, checklists, comments.
- **Kanban board**: drag-and-drop between Todo / In Progress / Completed, persisted to MongoDB.
- **Dashboard**: real MongoDB-backed stats and 3 charts (tasks by status, tasks by priority, project progress) via Recharts.
- **Search & filters**: search tasks by title; filter by status, priority, assignee, project; sort by newest/oldest/due date/priority.
- **Comments**: per-task comment thread with avatars and timestamps.
- **Notifications**: in-app notification bell with unread count, mark-as-read, real-time delivery via Socket.IO.
- **Real-time updates**: task assignment, status changes, new comments, and notifications push live to connected clients — no manual refresh needed.
- **Responsive UI**: mobile-friendly sidebar, horizontally scrollable Kanban on small screens, stacking dashboard cards.

---

## 2. Tech Stack

**Frontend:** React (Vite), JavaScript (ES6+), React Router DOM, Axios, Tailwind CSS, Recharts, Lucide React icons, Socket.IO client

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Socket.IO

---

## 3. Folder Structure

```text
teamflow/
├── server/
│   ├── config/          # MongoDB connection
│   ├── controllers/      # Route handler logic
│   ├── middleware/       # auth, error handling, async wrapper
│   ├── models/            # Mongoose schemas (User, Project, Task, Comment, Notification)
│   ├── routes/            # Express routers
│   ├── socket/             # Socket.IO auth + event wiring
│   ├── utils/               # token generation, notification helper
│   ├── seed/                # demo data seed script
│   ├── app.js
│   └── server.js
└── client/
    └── src/
        ├── components/    # reusable UI (Modal, Kanban, TaskCard, Toast, etc.)
        ├── pages/           # route-level pages
        ├── layouts/         # DashboardLayout (sidebar + topbar)
        ├── context/         # AuthContext, NotificationContext
        ├── services/        # axios instance, socket client
        ├── utils/             # date formatting helpers
        ├── App.jsx
        └── main.jsx
```

---

## 4. Installation

### Prerequisites
- Node.js 18+
- A MongoDB instance (local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env and set MONGODB_URI, JWT_SECRET, etc.
npm run seed     # creates demo users/projects/tasks
npm run dev       # starts the API on http://localhost:5000
```

### Frontend setup

```bash
cd client
npm install
cp .env.example .env
# edit .env if your API isn't on localhost:5000
npm run dev       # starts the app on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 5. Environment Variables

**server/.env**
```text
PORT=5000
MONGODB_URI=mongodb://localhost:27017/teamflow
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**client/.env**
```text
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 6. Demo Credentials

> ⚠️ **These are development/demo credentials created by the seed script. Change or remove them before deploying to production.**

| Role   | Email                 | Password    |
|--------|------------------------|-------------|
| Admin  | admin@teamflow.com     | Admin@123   |
| Member | member@teamflow.com    | Member@123  |

The seed script also creates two extra members (`priya@teamflow.com`, `sam@teamflow.com`, both `Member@123`), 3 projects, and 11 tasks with checklists and comments.

---

## 7. API Overview

```text
POST   /api/auth/register              Register a new user
POST   /api/auth/login                 Login, returns JWT
GET    /api/auth/me                    Get current user
POST   /api/auth/logout                Logout (client discards token)

GET    /api/users                      List all users
PUT    /api/users/profile              Update own name/avatar

GET    /api/projects                   List projects visible to user
POST   /api/projects                   Create project (admin)
GET    /api/projects/:id               Project detail + tasks + stats
PUT    /api/projects/:id               Update project (admin)
DELETE /api/projects/:id               Delete project + its tasks (admin)
POST   /api/projects/:id/members       Add member (admin)
DELETE /api/projects/:id/members/:uid  Remove member (admin)

GET    /api/tasks                      List tasks (search/filter/sort via query params)
POST   /api/tasks                      Create task (admin)
GET    /api/tasks/:id                  Task detail + comments
PUT    /api/tasks/:id                  Update task details (admin)
DELETE /api/tasks/:id                  Delete task (admin)
PATCH  /api/tasks/:id/status           Update status (assignee or admin) — powers Kanban drag/drop
PATCH  /api/tasks/:id/checklist/:iid   Toggle a checklist item

GET    /api/tasks/:taskId/comments     List comments on a task
POST   /api/tasks/:taskId/comments     Add a comment

GET    /api/notifications              List notifications + unread count
PATCH  /api/notifications/:id/read     Mark one as read
PATCH  /api/notifications/read-all     Mark all as read

GET    /api/dashboard                  Aggregate stats + chart data
```

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

---

## 8. Architecture (Simple Explanation)

**Request flow:**
```
React (Axios) → Express routes → Controllers → Mongoose models → MongoDB
```

**Real-time flow:**
```
React (Socket.IO client) → Node.js Socket.IO server → broadcast to relevant rooms
```

Each connected user joins a personal room (`user:<id>`) for notifications, and a `project:<id>` room while viewing that project's board, so events (new task, status change, new comment) only reach the people who should see them.

---

## 9. Future Improvements

- File attachments on tasks
- Activity/audit log per project
- Email notifications alongside in-app ones
- Recurring tasks and task templates
- Pagination/infinite scroll for large task lists
- TypeScript migration
- Automated test suite (Jest + Supertest, React Testing Library)
