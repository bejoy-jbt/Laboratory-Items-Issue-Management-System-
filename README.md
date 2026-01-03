# Laboratory Items Issue Management System

A comprehensive full-stack web application for managing laboratory items with role-based access control.

## Tech Stack

- **Frontend**: React + Tailwind CSS + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT-based with role-based access control

## Features

### Roles

1. **Super Admin**: Create admins, create labs, assign admins to labs
2. **Admin**: View assigned labs, create lab admins, view lab reports
3. **Lab Admin**: Manage items, issue/return items, view issue history
4. **User**: View available items, request items, return items

## Project Structure

```
├── backend/
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── superAdmin.routes.js
│   │   ├── admin.routes.js
│   │   ├── labAdmin.routes.js
│   │   └── user.routes.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
cp .env.example .env
```

Or create it manually with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lab_items_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development

# Email Configuration (for overdue notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**IMPORTANT**: 
- The `MONGODB_URI` must include the database name at the end (e.g., `/lab_items_db`). 
  - ✅ Correct: `mongodb://localhost:27017/lab_items_db`
  - ❌ Wrong: `mongodb://localhost:27017` (missing database name)
- For Gmail, you need to use an **App Password** (not your regular password). Generate it from Google Account settings.

4. Generate Prisma client (REQUIRED before running server or seed):
```bash
npm run prisma:generate
```

5. Push the schema to MongoDB:
```bash
npm run prisma:push
```

6. Seed the database:
```bash
npm run prisma:seed
```

**OR** run all setup steps at once:
```bash
npm run setup
```

7. Start the backend server:
```bash
npm run dev
```

**Note:** If you see the error "@prisma/client did not initialize yet", make sure you run `npm run prisma:generate` first!

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Login Credentials

After seeding the database, you can use these credentials:

- **Super Admin**: `superadmin@lab.com` / `superadmin123`
- **Admin**: `admin@lab.com` / `admin123`
- **Lab Admin**: `labadmin@lab.com` / `labadmin123`
- **User**: `user@lab.com` / `user123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Super Admin
- `POST /api/super-admin/create-admin` - Create admin
- `POST /api/super-admin/create-lab` - Create lab
- `PUT /api/super-admin/assign-admin/:labId` - Assign admin to lab
- `GET /api/super-admin/admins` - Get all admins
- `GET /api/super-admin/labs` - Get all labs

### Admin
- `GET /api/admin/labs` - Get assigned labs
- `POST /api/admin/create-lab-admin` - Create lab admin
- `GET /api/admin/reports/:labId` - Get lab reports
- `GET /api/admin/lab-admins/:labId` - Get lab admins

### Lab Admin
- `GET /api/lab-admin/items` - Get all items
- `POST /api/lab-admin/items` - Create item
- `PUT /api/lab-admin/items/:itemId` - Update item
- `DELETE /api/lab-admin/items/:itemId` - Delete item
- `POST /api/lab-admin/issue` - Issue item
- `POST /api/lab-admin/return/:issueRecordId` - Return item
- `GET /api/lab-admin/issue-history` - Get issue history
- `GET /api/lab-admin/stats` - Get dashboard stats

### User
- `GET /api/user/items` - Get available items
- `POST /api/user/request-issue/:itemId` - Request item issue
- `GET /api/user/issued-items` - Get issued items
- `POST /api/user/return/:issueRecordId` - Return item
- `GET /api/user/stats` - Get user stats

## Database Schema

- **User**: id, name, email, password, role, labId
- **Lab**: id, name, department, empId (admin)
- **Item**: id, name, category, status, labId, description
- **IssueRecord**: id, userId, itemId, labId, issueTime, returnTime

## Features Implemented

✅ Role-based authentication and authorization
✅ JWT token-based authentication
✅ Protected routes on frontend
✅ Dashboard for each role
✅ Item management (CRUD operations)
✅ Issue and return functionality
✅ Issue history tracking
✅ Statistics and reports
✅ Responsive UI with Tailwind CSS
✅ Clean component separation
✅ Service layer architecture

## Development

- Backend uses nodemon for auto-reload
- Frontend uses Vite for fast HMR
- Prisma for type-safe database access
- Axios for HTTP requests

## License

MIT

