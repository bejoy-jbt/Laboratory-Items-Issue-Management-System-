# Laboratory Items Issue Management System

A comprehensive full-stack web application for managing laboratory items with role-based access control, user image management, and face recognition-based item issuance.

## 🚀 Features

### Core Features
- ✅ **Role-Based Access Control**: Four-tier role system (Super Admin, Admin, Lab Admin, User)
- ✅ **User Image Management**: Upload and store user profile images
- ✅ **Face Recognition**: Face verification before item issuance for enhanced security
- ✅ **Item Management**: Complete CRUD operations for laboratory items
- ✅ **Issue & Return Tracking**: Track item issuance and returns with timestamps
- ✅ **Automated Notifications**: Email alerts for overdue items
- ✅ **Real-time Status Updates**: Live tracking of item availability
- ✅ **Comprehensive Reports**: Statistics and analytics for all roles
- ✅ **User Self-Service**: Users can issue items themselves with face verification

### User Roles

1. **Super Admin**
   - Create and manage administrators
   - Create laboratories
   - Assign admins to labs
   - System-wide oversight and reports

2. **Admin**
   - Manage assigned laboratories
   - Create lab administrators
   - View lab reports and statistics
   - Create users for assigned labs

3. **Lab Admin**
   - Manage items (Add/Edit/Delete)
   - Issue items to users (with face verification)
   - Track issue history
   - Set estimated return times
   - Mark items as returned

4. **User**
   - View available items
   - Issue items themselves (with face verification)
   - View issued items
   - Return items
   - Check overdue status

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI Framework
- **Tailwind CSS** - Styling
- **Vite** - Build Tool
- **React Router** - Navigation
- **Axios** - HTTP Client

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **MongoDB** - NoSQL Database
- **Prisma** - ORM
- **JWT** - Authentication
- **Multer** - File Upload Handling
- **Nodemailer** - Email Service
- **Node-cron** - Scheduled Tasks

### Face Recognition Service
- **Python Flask** - Microservice Framework
- **OpenCV** - Computer Vision
- **face_recognition** (optional) - Advanced face recognition

## 📁 Project Structure

```
Major_Project/
├── backend/
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── upload.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── superAdmin.routes.js
│   │   ├── admin.routes.js
│   │   ├── labAdmin.routes.js
│   │   ├── user.routes.js
│   │   └── faceRecognition.routes.js
│   ├── services/
│   │   ├── email.service.js
│   │   ├── overdueChecker.service.js
│   │   └── faceRecognition.service.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── uploads/          # User uploaded images
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── labAdmin/
│   │   │   ├── superAdmin/
│   │   │   ├── user/
│   │   │   ├── FaceScanPython.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
├── face_recognition_service/
│   ├── app.py            # Python Flask service (full version)
│   ├── app_simple.py     # Python Flask service (simple version)
│   ├── requirements.txt  # Full version dependencies
│   ├── requirements_simple.txt  # Simple version dependencies
│   └── uploads/          # Temporary file storage
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (running locally or connection string)
- **Python 3.8+** (for face recognition service - optional)
- **npm** or **yarn**

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

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

# Face Recognition Service URL (optional)
FACE_RECOGNITION_SERVICE_URL=http://localhost:5001
```

**Important Notes:**
- `MONGODB_URI` must include the database name (e.g., `/lab_items_db`)
- For Gmail, use an **App Password** (not your regular password)
- Generate App Password from: Google Account → Security → 2-Step Verification → App Passwords

Initialize the database:

```bash
npm run setup
# This runs: prisma:generate, prisma:push, and prisma:seed
```

Start the backend server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### 3. Face Recognition Service Setup (Optional but Recommended)

#### Option A: Simple Setup (No dlib/CMake Required) - Recommended for Windows

```bash
cd face_recognition_service
pip install -r requirements_simple.txt
python app_simple.py
```

This uses OpenCV only - no compilation needed!

#### Option B: Full Setup (Better Accuracy)

**Windows:**
1. Install CMake from https://cmake.org/download/
2. Install Visual Studio Build Tools
3. Then:
```bash
cd face_recognition_service
pip install -r requirements.txt
python app.py
```

**Linux/Mac:**
```bash
cd face_recognition_service
pip install -r requirements.txt
python app.py
```

The Python service runs on `http://localhost:5001`

**Note:** If you skip the face recognition service, the system will still work but face verification features will be unavailable.

## 🔐 Default Login Credentials

After seeding the database:

- **Super Admin**: `superadmin@lab.com` / `superadmin123`
- **Admin**: `admin@lab.com` / `admin123`
- **Lab Admin**: `labadmin@lab.com` / `labadmin123`
- **User**: `user@lab.com` / `user123`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Super Admin
- `POST /api/super-admin/create-admin` - Create admin
- `POST /api/super-admin/create-lab` - Create lab
- `POST /api/super-admin/create-user` - Create user (with image upload)
- `PUT /api/super-admin/assign-admin/:labId` - Assign admin to lab
- `GET /api/super-admin/admins` - Get all admins
- `GET /api/super-admin/labs` - Get all labs
- `GET /api/super-admin/users` - Get all users

### Admin
- `GET /api/admin/labs` - Get assigned labs
- `POST /api/admin/create-lab-admin` - Create lab admin
- `POST /api/admin/create-user` - Create user (with image upload)
- `GET /api/admin/reports/:labId` - Get lab reports
- `GET /api/admin/users` - Get users

### Lab Admin
- `GET /api/lab-admin/items` - Get all items
- `POST /api/lab-admin/items` - Create item
- `PUT /api/lab-admin/items/:itemId` - Update item
- `DELETE /api/lab-admin/items/:itemId` - Delete item
- `POST /api/lab-admin/issue` - Issue item (with face verification)
- `POST /api/lab-admin/return/:issueRecordId` - Return item
- `GET /api/lab-admin/issue-history` - Get issue history
- `GET /api/lab-admin/users` - Get users in lab
- `GET /api/lab-admin/stats` - Get dashboard stats

### User
- `GET /api/user/items` - Get available items
- `POST /api/user/issue/:itemId` - Issue item (with face verification)
- `GET /api/user/issued-items` - Get issued items
- `POST /api/user/return/:issueRecordId` - Return item
- `GET /api/user/stats` - Get user stats

### Face Recognition
- `GET /api/face-recognition/health` - Check service health
- `POST /api/face-recognition/detect` - Detect face in image
- `POST /api/face-recognition/verify` - Verify face against user
- `POST /api/face-recognition/compare` - Compare two face encodings

## 🎯 Key Features Explained

### User Image Upload
- Users can upload profile images during account creation
- Images stored in `backend/uploads/` directory
- Served statically at `/uploads/:filename`
- Required for face verification

### Face Recognition & Verification
- **During User Creation**: Optional face scanning to capture face descriptor
- **During Item Issuance**: Face verification required before issuing items
- **Visual Feedback**: Clear indicators for face detection, verification success/failure
- **Mismatch Detection**: Shows "Face Mismatch" message when verification fails

### Item Issuance Flow
1. User/Lab Admin selects item and user
2. Sets estimated return time
3. Face verification screen appears
4. User positions face in camera
5. System verifies face against stored image
6. On success: Item is issued
7. On failure: "Face Mismatch" error shown

## 🗄️ Database Schema

### User Model
```prisma
model User {
  id            String   @id @default(auto())
  name          String
  email         String   @unique
  password      String
  role          Role
  labId         String?
  imageUrl      String?  // User profile image
  faceDescriptor String?  // Base64 encoded face descriptor
  createdAt     DateTime
  updatedAt     DateTime
}
```

### Item Model
```prisma
model Item {
  id          String     @id @default(auto())
  name        String
  category    String
  status      ItemStatus @default(AVAILABLE)
  labId       String
  description String?
  createdAt   DateTime
  updatedAt   DateTime
}
```

### IssueRecord Model
```prisma
model IssueRecord {
  id                String    @id @default(auto())
  userId            String
  itemId            String
  labId             String
  issueTime         DateTime
  estimatedReturnTime DateTime?
  returnTime        DateTime?
  notificationSent  Boolean   @default(false)
  createdAt         DateTime
  updatedAt         DateTime
}
```

## 🔧 Configuration

### Email Setup (for Overdue Notifications)

1. **Gmail Setup:**
   - Enable 2-Step Verification
   - Generate App Password: Google Account → Security → 2-Step Verification → App Passwords
   - Use the App Password in `.env` file

2. **Other Email Services:**
   - Update `EMAIL_SERVICE` in `.env`
   - Configure appropriate credentials

### Face Recognition Service

The system supports two versions:

1. **Simple Version** (`app_simple.py`):
   - Uses OpenCV only
   - No compilation required
   - ~80-85% accuracy
   - Perfect for Windows/quick setup

2. **Full Version** (`app.py`):
   - Uses face_recognition library
   - Requires CMake and C++ compiler
   - ~95-98% accuracy
   - Better for production

Both versions use the same API endpoints - no code changes needed!

## 🐛 Troubleshooting

### Backend Issues

**"Cannot find package 'multer'" or similar errors:**
```bash
cd backend
npm install
```

**"@prisma/client did not initialize yet":**
```bash
cd backend
npm run prisma:generate
```

**Database connection errors:**
- Check MongoDB is running
- Verify `MONGODB_URI` includes database name
- Ensure MongoDB is accessible

### Frontend Issues

**"Cannot find module 'face-api.js'":**
- This is expected if using Python service
- The component uses `FaceScanPython` which doesn't require face-api.js

**Port already in use:**
- Change port in `vite.config.js` or `backend/server.js`
- Or stop the process using the port

### Face Recognition Service Issues

**Python service won't start:**
- Check Python version: `python --version` (should be 3.8+)
- Verify port 5001 is available
- Check dependencies: `pip list`

**"No CMAKE_C_COMPILER found":**
- Use the simple version: `app_simple.py` instead
- Or install CMake and Visual Studio Build Tools

**Face detection not working:**
- Ensure camera permissions are granted
- Check browser console for errors
- Verify Python service is running: `http://localhost:5001/health`

## 📝 Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

**Frontend:**
```bash
cd frontend
npm run dev  # Uses Vite for fast HMR
```

**Face Recognition Service:**
```bash
cd face_recognition_service
python app_simple.py  # or app.py
```

### Database Operations

**Generate Prisma Client:**
```bash
cd backend
npm run prisma:generate
```

**Update Database Schema:**
```bash
npm run prisma:push
```

**Seed Database:**
```bash
npm run prisma:seed
```

**All at once:**
```bash
npm run setup
```

## 🚢 Production Deployment

### Environment Variables

Ensure all environment variables are set in production:
- `MONGODB_URI` - Production MongoDB connection
- `JWT_SECRET` - Strong secret key
- `EMAIL_*` - Production email credentials
- `FACE_RECOGNITION_SERVICE_URL` - Production service URL

### Security Considerations

1. **JWT Secret**: Use a strong, random secret in production
2. **File Uploads**: Implement file size limits and validation
3. **HTTPS**: Required for camera access in browsers
4. **CORS**: Configure properly for production domain
5. **Rate Limiting**: Consider adding rate limiting for API endpoints

### Docker Deployment (Optional)

Create `Dockerfile` for each service:
- Backend Dockerfile
- Frontend Dockerfile  
- Python service Dockerfile

Use `docker-compose.yml` to orchestrate all services.

## 📚 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **Express.js Guide**: https://expressjs.com/en/guide/routing.html
- **React Documentation**: https://react.dev
- **OpenCV Python**: https://opencv-python-tutroals.readthedocs.io

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License

## 👥 Authors

Laboratory Items Issue Management System - Full Stack Project

---

**Note**: This system requires both Node.js backend and optional Python face recognition service for full functionality. The system will work without the Python service, but face verification features will be unavailable.
