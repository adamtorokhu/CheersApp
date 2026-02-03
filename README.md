# CheersApp

CheersApp is a full-stack social review application where users can share and rate their favorite beverages, beers, and drinks. Users can create reviews, comment on others' reviews, add friends, and engage with the community through a "cheers" system (similar to likes).

## 🎯 Features

- **User Authentication**: Secure registration and login with JWT-based authentication
- **Review Management**: Create, read, update, and delete beverage reviews
- **Rating System**: Rate beverages with detailed information including name, style, location, and images
- **Social Interaction**: 
  - Add and manage friends
  - Comment on reviews
  - "Cheers" system to show appreciation for reviews
- **User Profiles**: View and edit user profiles with profile pictures
- **Admin Features**: Admin users can manage all users and reviews
- **Protected Routes**: Role-based access control for sensitive operations

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and development server
- **React Icons** - Icon library
- **React DatePicker** - Date selection component
- **date-fns** - Date utility library

### Backend
- **Node.js** - Runtime environment
- **Express.js 5** - Web application framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/adamtorokhu/CheersApp.git
cd CheersApp
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
# Create a .env file in the backend directory with the following variables:
```

**Backend `.env` file:**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cheersapp
ACCESS_TOKEN_SECRET=your_jwt_secret_key_here
NODE_ENV=development
# Optional: Set COOKIE_DOMAIN only if frontend and backend share the same parent domain
# COOKIE_DOMAIN=.yourdomain.com
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file (if needed for API URL)
# The frontend connects to the backend API
```

**Frontend `.env` file (optional):**
```env
VITE_API_URL=http://localhost:3000
```

## 🏃 Running the Application

### Development Mode

**Backend:**
```bash
cd backend
npm start
# Server runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm run dev
# Development server runs on http://localhost:5173 (default Vite port)
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
CheersApp/
├── backend/
│   ├── controllers/         # Route handlers and business logic
│   │   ├── commentController.js
│   │   ├── reviewController.js
│   │   └── userController.js
│   ├── models/             # Database models (MongoDB)
│   │   ├── commentModelMongo.js
│   │   ├── reviewModelMongo.js
│   │   └── userModelMongo.js
│   ├── routes/             # API route definitions
│   │   ├── index.js        # Main routes (auth, login, logout)
│   │   ├── users.js        # User management routes
│   │   ├── review.js       # Review routes
│   │   └── friends.js      # Friends management routes
│   ├── services/           # Utility services
│   │   ├── mongodb.js      # MongoDB connection
│   │   └── authentication.js
│   ├── public/             # Static files and uploads
│   ├── app.js             # Express app configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── UserFormPage.jsx
│   │   │   ├── UserDetailPage.jsx
│   │   │   ├── UsersListPage.jsx
│   │   │   ├── ReviewFormPage.jsx
│   │   │   ├── ReviewDetailPage.jsx
│   │   │   ├── AddFriends.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── services/       # API service functions
│   │   ├── assets/         # Static assets
│   │   ├── App.jsx         # Main App component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── public/             # Public static files
│   ├── index.html
│   ├── vite.config.js      # Vite configuration
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `GET /` - API health check
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /users/new` - User registration
- `GET /current-user` - Get authenticated user data (requires auth)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:user_id` - Get user by ID
- `PUT /api/users/:user_id` - Update user (requires auth)
- `DELETE /api/users/:user_id` - Delete user (requires auth)

### Reviews
- `GET /api/reviews` - Get all reviews (public)
- `GET /api/reviews/:review_id` - Get review by ID (public)
- `POST /api/reviews` - Create new review (requires auth)
- `PUT /api/reviews/:review_id` - Update review (requires auth)
- `DELETE /api/reviews/:review_id` - Delete review (requires auth)

### Comments
- `GET /api/reviews/:reviewId/comments` - Get comments for a review (public)
- `POST /api/reviews/:reviewId/comments` - Add comment to review (requires auth)
- `DELETE /api/reviews/:reviewId/comments/:commentId` - Delete comment (requires auth)

### Friends
- `GET /api/friends` - Get user's friends (requires auth)
- `POST /api/friends` - Add friend (requires auth)
- `DELETE /api/friends/:friendId` - Remove friend (requires auth)

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens are stored in HTTP-only cookies for security
- Protected routes require valid authentication
- Admin routes require both authentication and admin role
- Passwords are hashed using bcrypt before storage

## 🖼️ File Uploads

The application supports image uploads for:
- User profile pictures
- Review images

Images are stored in the `backend/public/uploads/` directory and validated to accept only jpg, jpeg, png, and gif formats.

## 🧪 Testing

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm run lint
```

## 📝 License

ISC

## 👨‍💻 Author

Created by adamtorokhu

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, please open an issue in the GitHub repository.