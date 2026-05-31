# Sign-Up App: Comprehensive Project Codebase & Guide

This document compiles the **complete source code** and **detailed explanations** for every single file in the **Sign-Up App** workspace (both backend and frontend), serving as a single reference point for the entire application.

---

## 📂 Project Structure

Here is a visual map of the files included in this project:

```
signup-app/
├── README.md                      # Root documentation and setup guide
├── COMPLETE_PROJECT_GUIDE.md      # This comprehensive guide
├── server/                        # Backend Node.js / Express server
│   ├── .env                       # Environment configuration
│   ├── package.json               # Backend dependencies & npm scripts
│   ├── server.js                  # Entry point for the Express backend
│   ├── models/
│   │   └── User.js                # MongoDB Mongoose Schema for Users
│   └── routes/
│       └── auth.js                # Signup authentication route & validation
└── client/                        # Frontend React / Vite application
    ├── package.json               # Frontend dependencies & npm scripts
    ├── vite.config.js             # Vite configuration and API proxy
    ├── index.html                 # HTML root with fonts & meta tags
    └── src/
        ├── main.jsx               # Entry point of the React app
        ├── App.jsx                # Main application component with background
        ├── App.css                # Global CSS reset & background animation rules
        └── components/
            ├── SignupForm.jsx     # Full-featured signup component with live validation
            └── SignupForm.css     # Glassmorphism container and form styling
```

---

# 🖥️ BACKEND (server/)

The backend is built with **Node.js**, **Express**, and **Mongoose** (MongoDB Atlas). It handles incoming HTTP requests, performs input validation, checks for existing accounts, hashes passwords securely using `bcryptjs`, and saves user data in a MongoDB database.

---

## 1. `server/package.json`

This file handles backend metadata, dependencies, and execution scripts.

```json
{
  "name": "signup-app-server",
  "version": "1.0.0",
  "description": "Node.js/Express backend for sign-up app with MongoDB",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "express-validator": "^7.2.0",
    "mongoose": "^8.7.0"
  }
}
```

### 📝 Explanation:
* **`scripts`**:
  * `"start"`: Runs the production server via standard Node.js.
  * `"dev"`: Runs the development server using Node.js's built-in `--watch` flag (introduced in Node 18+), which automatically restarts the server when any file changes, eliminating the need for `nodemon`.
* **`dependencies`**:
  * `bcryptjs`: Used to hash passwords securely using a salted one-way hashing function.
  * `cors`: Cross-Origin Resource Sharing middleware, enabling the React frontend (running on port 3000) to communicate with this Express server (running on port 5000).
  * `dotenv`: Loads environment variables from the `.env` file into `process.env`.
  * `express`: The core web application framework for building our API endpoints.
  * `express-validator`: An elegant validation library that sanitizes and validates incoming user input.
  * `mongoose`: The official Object Data Modeling (ODM) library for MongoDB, allowing us to interact with the database using structured schemas.

---

## 2. `server/.env`

Contains local configuration and environment secrets.

```env
# MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://prediptadebbarman_db_user:7JM1BKI1MPboeQ4l@cluster0.vdoffwq.mongodb.net/signupApp?retryWrites=true&w=majority

# Server Port
PORT=5000
```

### 📝 Explanation:
* **`MONGO_URI`**: The connection string pointing to the MongoDB Atlas cluster. Notice that `/signupApp` has been appended before the query parameter `?` to explicitly instruct Mongoose to write to a database named `signupApp`.
* **`PORT`**: Defines the local port number on which the backend server will listen for requests.

---

## 3. `server/server.js`

This is the main entry point of our backend. It configures Express, initializes database connections, and mounts our routers.

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
require('dotenv').config();

// Use Google DNS to resolve MongoDB SRV records
// (some ISP DNS servers don't support SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
```

### 📝 Explanation:
* **`dns.setServers(...)`**: A robust fallback to Google DNS. Some residential ISPs block or fail to resolve the DNS SRV records (`mongodb+srv://`) used by MongoDB Atlas. Forcing Express to use Google Public DNS avoids connection failures.
* **`express.json()`**: A built-in middleware that parses incoming requests with JSON payloads and makes the data accessible in `req.body`.
* **`app.use('/api/auth', authRoutes)`**: Directs all incoming requests beginning with `/api/auth` to our authentication router.
* **`mongoose.connect(...)`**: Connects to the remote cluster asynchronously. The Express server only starts listening (`app.listen`) after a successful database connection is established, ensuring that the backend never starts in a disconnected state.

---

## 4. `server/models/User.js`

Defines the structure of user data in MongoDB and enforces schema-level validation.

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must be at most 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Remove password from JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Expose model
module.exports = mongoose.model('User', userSchema);
```

### 📝 Explanation:
* **Database Sanitization**:
  * `trim: true`: Automatically strips leading/trailing spaces from user input.
  * `lowercase: true`: Converts all emails to lowercase before saving, preventing case-sensitive duplicate issues.
  * `unique: true`: Forces MongoDB to build a unique index on emails, ensuring no two users can register with the same address.
* **Security Layer (`toJSON` override)**:
  * A custom method is attached to our Mongoose schema. Whenever a User document is converted to JSON (e.g., via `res.json(user)` in a route), the `password` field is automatically deleted. This ensures we **never** accidentally leak hashed passwords back to the client.

---

## 5. `server/routes/auth.js`

This route handles sign-up request processing, input validation, and password cryptography.

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map((err) => err.msg),
        });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error. Please try again later.',
      });
    }
  }
);

module.exports = router;
```

### 📝 Explanation:
* **Express-Validator Array**: Evaluates requirements for `name`, `email`, and `password` on the request. It includes checks for string length, valid email syntax, and regular expressions for password strength (requiring lowercase, uppercase, and numbers).
* **Validation Check (`validationResult`)**: Inspects the request for any validation failures. If errors exist, the endpoint returns a `400 Bad Request` payload containing a clean array of error messages.
* **Duplicate Prevention (`User.findOne`)**: Searches the database for the requested email. If a user is found, the server responds immediately with `409 Conflict`.
* **Password Hashing (`bcrypt.genSalt` & `bcrypt.hash`)**: Generates a cryptographically strong salt with `10` rounds, hashes the plain-text password, and saves the secure hash, keeping plain-text passwords out of database logs.

---

# 🎨 FRONTEND (client/)

The frontend is a lightweight **React 18** application scaffolded using **Vite**. It features a modern, futuristic UI with smooth glassmorphism, background lighting orbs with float animations, password-strength indicators, and interactive forms with real-time feedback.

---

## 6. `client/package.json`

Manages client-side metadata, execution scripts, and libraries.

```json
{
  "name": "signup-app-client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.8",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.7"
  }
}
```

### 📝 Explanation:
* **`type: "module"`**: Specifies that the project compiles using ES Modules (`import`/`export` syntax).
* **`dependencies`**:
  * `axios`: A robust HTTP client used to send JSON requests to our backend.
  * `react` & `react-dom`: The core component libraries powering the client-side UI.
* **`devDependencies`**: Includes Vite and its official React plugin for lightning-fast compilation and Hot Module Replacement (HMR).

---

## 7. `client/vite.config.js`

The configuration file for Vite.

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### 📝 Explanation:
* **`port: 3000`**: Overrides Vite's default port, ensuring the React app always starts on `http://localhost:3000`.
* **`proxy`**: Solves Cross-Origin (CORS) development challenges. Any request starting with `/api` in React (e.g. `axios.post('/api/auth/signup')`) is transparently forwarded by Vite to the Express server running at `http://localhost:5000`. This allows us to use relative URLs and avoids CORS configuration mismatches during development.

---

## 8. `client/index.html`

The root HTML document.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Create your account and join our platform. Sign up with your name, email, and a secure password." />
    <title>Sign Up | Create Your Account</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 📝 Explanation:
* **SEO & Meta**: Implements basic SEO guidelines, including viewport adjustments for responsive scaling and descriptive meta tags.
* **Modern Typography**: Connects to Google Fonts to load the **Inter** font family, replacing browser defaults with high-premium, legible sans-serif styles.
* **Root Mount Point**: `<div id="root">` is where our React application mounts and renders dynamic DOM elements.

---

## 9. `client/src/main.jsx`

Mounts React to the DOM inside `<div id="root">`.

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 📝 Explanation:
* **`ReactDOM.createRoot`**: React 18's dynamic entry model.
* **`React.StrictMode`**: Performs additional checks and warnings in development mode to help find bugs early (e.g., unexpected side effects, deprecated methods).

---

## 10. `client/src/App.jsx`

Provides the global visual scaffold, background effects, and renders the central signup card.

```javascript
import React from 'react';
import SignupForm from './components/SignupForm';

function App() {
  return (
    <div className="app">
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb--1" aria-hidden="true"></div>
      <div className="bg-orb bg-orb--2" aria-hidden="true"></div>
      <div className="bg-orb bg-orb--3" aria-hidden="true"></div>

      <main className="app__main">
        <SignupForm />
      </main>
    </div>
  );
}

export default App;
```

### 📝 Explanation:
* **`aria-hidden="true"`**: Background lighting orbs are purely aesthetic. Marking them with `aria-hidden` guarantees screen readers will skip them, maintaining high accessibility.
* **`app` layout wrapper**: Coordinates centering the signup container vertically and horizontally on all viewports.

---

## 11. `client/src/App.css`

Contains global resets, custom properties, app layouts, and animated background orbs.

```css
/* ==========================================
   GLOBAL RESET & BASE STYLES
   ========================================== */

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* Color Palette */
  --color-bg: #0a0a1a;
  --color-surface: rgba(255, 255, 255, 0.04);
  --color-surface-hover: rgba(255, 255, 255, 0.07);
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-focus: rgba(139, 92, 246, 0.5);
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-text-dim: #64748b;

  /* Accent Gradient */
  --gradient-primary: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #8b5cf6 100%);
  --gradient-primary-hover: linear-gradient(135deg, #a78bfa 0%, #22d3ee 50%, #a78bfa 100%);
  --color-accent: #8b5cf6;
  --color-accent-cyan: #06b6d4;

  /* Status Colors */
  --color-success: #10b981;
  --color-error: #f43f5e;
  --color-warning: #f59e0b;

  /* Shadows */
  --shadow-glow: 0 0 60px rgba(139, 92, 246, 0.15), 0 0 120px rgba(6, 182, 212, 0.08);
  --shadow-card: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family);
  background-color: var(--color-bg);
  color: var(--color-text);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ==========================================
   APP LAYOUT
   ========================================== */

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 2rem;
}

.app__main {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480px;
}

/* ==========================================
   ANIMATED BACKGROUND ORBS
   ========================================== */

.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
}

.bg-orb--1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%);
  top: -10%;
  left: -10%;
  animation: orbFloat1 18s ease-in-out infinite;
}

.bg-orb--2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
  bottom: -5%;
  right: -5%;
  animation: orbFloat2 22s ease-in-out infinite;
}

.bg-orb--3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: orbFloat3 15s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(60px, 40px) scale(1.1); }
  66% { transform: translate(-30px, 60px) scale(0.95); }
}

@keyframes orbFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-50px, -30px) scale(1.05); }
  66% { transform: translate(40px, -50px) scale(0.9); }
}

@keyframes orbFloat3 {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-40%, -60%) scale(1.15); }
}

/* ==========================================
   SCROLLBAR
   ========================================== */

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

### 📝 Explanation:
* **Custom CSS variables**: Uses a clean, harmonized palette based on Tailwind-style deep indigo/cyan gradients and dark background spaces.
* **Animated Background Orbs**: Implements three fixed positioning divisions blurred at `80px` running independent non-linear loops (`orbFloat1` etc.), creating a live, high-end backdrop.
* **Webkit scrollbars**: Replaces default blocky browser scrollbars with custom translucent thumbs to preserve design premium.

---

## 12. `client/src/components/SignupForm.jsx`

This is the flagship component. It contains state management, user interactive fields, input blur events, live-validation, custom password strength calculations, and API communications.

```javascript
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './SignupForm.css';

/* ───────── helpers ───────── */
const validateField = (name, value, formData) => {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (value.trim().length > 50) return 'Name must be at most 50 characters';
      return '';

    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
      return '';

    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'At least 8 characters';
      if (!/[A-Z]/.test(value)) return 'Include an uppercase letter';
      if (!/[a-z]/.test(value)) return 'Include a lowercase letter';
      if (!/[0-9]/.test(value)) return 'Include a number';
      return '';

    case 'confirmPassword':
      if (!value) return 'Please confirm your password';
      if (value !== formData.password) return 'Passwords do not match';
      return '';

    default:
      return '';
  }
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', className: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', className: 'weak' };
  if (score <= 3) return { score, label: 'Fair', className: 'fair' };
  if (score <= 4) return { score, label: 'Strong', className: 'strong' };
  return { score, label: 'Excellent', className: 'excellent' };
};

/* ───────── component ───────── */
export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' }); // 'success' | 'error' | 'loading'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  /* handlers */
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        // live‑validate only if the field was already touched
        if (touched[name]) {
          setErrors((prevErr) => ({
            ...prevErr,
            [name]: validateField(name, value, next),
            // also re-validate confirmPassword when password changes
            ...(name === 'password' && touched.confirmPassword
              ? { confirmPassword: validateField('confirmPassword', next.confirmPassword, next) }
              : {}),
          }));
        }
        return next;
      });
    },
    [touched]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, formData) }));
    },
    [formData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const fields = ['name', 'email', 'password', 'confirmPassword'];
    const newErrors = {};
    fields.forEach((f) => {
      newErrors[f] = validateField(f, formData[f], formData);
    });
    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (Object.values(newErrors).some((msg) => msg)) return;

    setStatus({ type: 'loading', message: '' });

    try {
      const res = await axios.post('/api/auth/signup', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setStatus({ type: 'success', message: res.data.message || 'Account created successfully!' });
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setTouched({});
      setErrors({});
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.join('. ') ||
        'Something went wrong. Please try again.';
      setStatus({ type: 'error', message: msg });
    }
  };

  const isLoading = status.type === 'loading';

  return (
    <div className="signup-card">
      {/* Glow border effect */}
      <div className="signup-card__glow" aria-hidden="true" />

      <div className="signup-card__inner">
        {/* Header */}
        <header className="signup-card__header">
          <div className="signup-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="signup-card__title">Create Account</h1>
          <p className="signup-card__subtitle">Join us today and get started in minutes</p>
        </header>

        {/* Status messages */}
        {status.type && status.type !== 'loading' && (
          <div className={`signup-alert signup-alert--${status.type}`} role="alert" id="signup-status">
            <span className="signup-alert__icon">
              {status.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              )}
            </span>
            <span>{status.message}</span>
          </div>
        )}

        {/* Form */}
        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className={`form-group ${touched.name && errors.name ? 'form-group--error' : ''} ${touched.name && !errors.name && formData.name ? 'form-group--valid' : ''}`}>
            <label htmlFor="signup-name" className="form-label">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </span>
              <input
                id="signup-name"
                type="text"
                name="name"
                className="form-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="name"
                disabled={isLoading}
              />
            </div>
            {touched.name && errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className={`form-group ${touched.email && errors.email ? 'form-group--error' : ''} ${touched.email && !errors.email && formData.email ? 'form-group--valid' : ''}`}>
            <label htmlFor="signup-email" className="form-label">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </span>
              <input
                id="signup-email"
                type="email"
                name="email"
                className="form-input"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            {touched.email && errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className={`form-group ${touched.password && errors.password ? 'form-group--error' : ''} ${touched.password && !errors.password && formData.password ? 'form-group--valid' : ''}`}>
            <label htmlFor="signup-password" className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>

            {/* Password strength meter */}
            {formData.password && (
              <div className="password-strength">
                <div className="password-strength__bar">
                  <div
                    className={`password-strength__fill password-strength__fill--${passwordStrength.className}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className={`password-strength__label password-strength__label--${passwordStrength.className}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}

            {touched.password && errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className={`form-group ${touched.confirmPassword && errors.confirmPassword ? 'form-group--error' : ''} ${touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword ? 'form-group--valid' : ''}`}>
            <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </span>
              <input
                id="signup-confirm"
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="signup-btn" id="signup-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="signup-btn__loader">
                <span className="spinner" aria-hidden="true" />
                Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="signup-card__footer">
          Already have an account?{' '}
          <a href="#" className="signup-link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 📝 Explanation:
* **Interactive Live Validation Flow**:
  1. Input elements initialize in a standard un-validated state.
  2. When a user exits a field (on `blur`), that specific input is marked as `touched`. Validation runs immediately on that field, displaying a precise, contextual instruction if necessary.
  3. Once a field has been touched, any keystrokes (`onChange`) trigger instantaneous **live validation** updates, letting the user know they've fixed the error without having to blur the field again.
* **Smart Validation Helper (`validateField`)**:
  * Consolidates all rules into a single state-independent helper function.
  * Dynamically re-validates `confirmPassword` if the user modifies their main `password` input afterward, ensuring the two remain exactly matched.
* **Secure and Responsive Submit**:
  * Clicking "Create Account" instantly runs a validation pass across all inputs, forcing them all into a `touched` state.
  * If valid, it triggers `setStatus({ type: 'loading', ... })`, which disables all inputs and the submit button, showing an elegant loader spinner to prevent duplicate form submissions.

---

## 13. `client/src/components/SignupForm.css`

Styles the sign-up container using vibrant linear gradients, absolute positioning layers, and glassmorphism.

```css
/* ==========================================
   SIGNUP CARD — Glassmorphism Container
   ========================================== */

.signup-card {
  position: relative;
  border-radius: 24px;
  animation: cardEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Animated gradient border */
.signup-card__glow {
  position: absolute;
  inset: -1px;
  border-radius: 24px;
  background: var(--gradient-primary);
  background-size: 200% 200%;
  animation: glowRotate 6s linear infinite;
  opacity: 0.6;
  z-index: 0;
  transition: opacity var(--transition-base);
}

.signup-card:hover .signup-card__glow {
  opacity: 0.85;
}

@keyframes glowRotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.signup-card__inner {
  position: relative;
  z-index: 1;
  background: rgba(15, 15, 35, 0.92);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-card);
}

/* ==========================================
   HEADER
   ========================================== */

.signup-card__header {
  text-align: center;
  margin-bottom: 2rem;
}

.signup-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
  border: 1px solid rgba(139, 92, 246, 0.2);
  margin-bottom: 1rem;
  color: var(--color-accent);
}

.signup-card__icon svg {
  width: 28px;
  height: 28px;
}

.signup-card__title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: var(--gradient-primary);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: glowRotate 6s linear infinite;
}

.signup-card__subtitle {
  margin-top: 0.5rem;
  font-size: 0.925rem;
  color: var(--color-text-muted);
  font-weight: 400;
}

/* ==========================================
   ALERT MESSAGES
   ========================================== */

.signup-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  animation: alertSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes alertSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.signup-alert--success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #34d399;
}

.signup-alert--error {
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.25);
  color: #fb7185;
}

.signup-alert__icon {
  flex-shrink: 0;
  display: flex;
}

.signup-alert__icon svg {
  width: 20px;
  height: 20px;
}

/* ==========================================
   FORM
   ========================================== */

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ==========================================
   FORM GROUP
   ========================================== */

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
  transition: color var(--transition-fast);
}

.form-group--error .form-label {
  color: var(--color-error);
}

.form-group--valid .form-label {
  color: var(--color-success);
}

/* ==========================================
   INPUT WRAPPER
   ========================================== */

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  display: flex;
  color: var(--color-text-dim);
  pointer-events: none;
  transition: color var(--transition-fast);
  z-index: 1;
}

.input-icon svg {
  width: 18px;
  height: 18px;
}

.form-group--error .input-icon {
  color: var(--color-error);
}

.form-group--valid .input-icon {
  color: var(--color-success);
}

.form-input {
  width: 100%;
  padding: 0.8125rem 0.875rem 0.8125rem 2.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  font-family: var(--font-family);
  font-size: 0.9375rem;
  outline: none;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}

.form-input::placeholder {
  color: var(--color-text-dim);
  opacity: 0.6;
}

.form-input:hover:not(:disabled) {
  background: var(--color-surface-hover);
  border-color: rgba(255, 255, 255, 0.12);
}

.form-input:focus {
  background: var(--color-surface-hover);
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.form-group--error .form-input {
  border-color: rgba(244, 63, 94, 0.5);
}

.form-group--error .form-input:focus {
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.12);
}

.form-group--valid .form-input {
  border-color: rgba(16, 185, 129, 0.4);
}

.form-group--valid .form-input:focus {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==========================================
   PASSWORD TOGGLE
   ========================================== */

.input-toggle {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
  border-radius: 8px;
  transition: color var(--transition-fast), background var(--transition-fast);
}

.input-toggle:hover {
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.05);
}

.input-toggle svg {
  width: 18px;
  height: 18px;
}

/* ==========================================
   PASSWORD STRENGTH METER
   ========================================== */

.password-strength {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.375rem;
  animation: alertSlide 0.25s ease;
}

.password-strength__bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

.password-strength__fill {
  height: 100%;
  border-radius: 4px;
  transition: width var(--transition-base), background var(--transition-base);
}

.password-strength__fill--weak {
  background: var(--color-error);
}
.password-strength__fill--fair {
  background: var(--color-warning);
}
.password-strength__fill--strong {
  background: #22c55e;
}
.password-strength__fill--excellent {
  background: var(--color-success);
}

.password-strength__label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 60px;
  text-align: right;
}

.password-strength__label--weak {
  color: var(--color-error);
}
.password-strength__label--fair {
  color: var(--color-warning);
}
.password-strength__label--strong {
  color: #22c55e;
}
.password-strength__label--excellent {
  color: var(--color-success);
}

/* ==========================================
   ERROR MESSAGE
   ========================================== */

.form-error {
  font-size: 0.75rem;
  color: var(--color-error);
  font-weight: 500;
  padding-left: 2px;
  animation: alertSlide 0.25s ease;
}

/* ==========================================
   SUBMIT BUTTON
   ========================================== */

.signup-btn {
  position: relative;
  width: 100%;
  padding: 0.9375rem;
  margin-top: 0.5rem;
  border: none;
  border-radius: 14px;
  background: var(--gradient-primary);
  background-size: 200% 200%;
  color: #fff;
  font-family: var(--font-family);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-base), opacity var(--transition-fast);
  animation: glowRotate 6s linear infinite;
}

.signup-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.35), 0 4px 12px rgba(6, 182, 212, 0.2);
}

.signup-btn:active:not(:disabled) {
  transform: translateY(0);
}

.signup-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.signup-btn__loader {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==========================================
   FOOTER
   ========================================== */

.signup-card__footer {
  text-align: center;
  margin-top: 1.75rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.signup-link {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.signup-link:hover {
  color: #a78bfa;
  text-decoration: underline;
}

/* ==========================================
   RESPONSIVE
   ========================================== */

@media (max-width: 520px) {
  .signup-card__inner {
    padding: 2rem 1.25rem;
  }

  .signup-card__title {
    font-size: 1.5rem;
  }
}
```

### 📝 Explanation:
* **`signup-card__glow`**: Implements a border wrapper set behind the main element with `inset: -1px` and `background: var(--gradient-primary)`. Adding an infinite CSS keyframe animation (`glowRotate`) causes the border gradient to rotate smoothly over time.
* **`backdrop-filter: blur(40px)`**: Triggers native hardware-accelerated background-blur filtering. Any content, shapes, or background lighting orbs that pass behind the card are dynamically softened, creating a luxury glass pane appearance.
* **Dynamic Hover Scales**: Form labels and icon borders transition gracefully on focus and validation states. The submit button rises by `-2px` on hover and gains a matching dynamic neon shadow.

---

# 📖 PROJECT DOCUMENTATION

---

## 14. `README.md`

Contains developer setup guidelines, prerequisites, and API usage specs.

```markdown
# Sign-Up App

A full-stack sign-up page built with **React**, **Node.js/Express**, and **MongoDB Atlas**.

## Prerequisites

- **Node.js** v18+ and npm
- A free **MongoDB Atlas** account → [mongodb.com/atlas](https://www.mongodb.com/atlas)

## Setup

### 1. MongoDB Atlas (Free Tier)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a **free M0 cluster** (any region)
3. Go to **Database Access** → Add a database user (username + password)
4. Go to **Network Access** → Add your current IP (or `0.0.0.0/0` for development)
5. Go to **Database** → Click **Connect** → Choose **Drivers** → Copy the connection string
6. It will look like: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### 2. Backend

```bash
cd server
npm install
```

Edit the `.env` file and replace the `MONGO_URI` with your Atlas connection string:

```env
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/signupApp?retryWrites=true&w=majority
PORT=5000
```

> **Important**: Add `/signupApp` before the `?` in the URI to specify the database name.

Start the server:

```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB Atlas
🚀 Server running on http://localhost:5000
```

### 3. Frontend

In a new terminal:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### `POST /api/auth/signup`

Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyPassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (409 — duplicate email):**
```json
{
  "success": false,
  "message": "An account with this email already exists"
}
```

### `GET /api/health`

Health check endpoint. Returns `{ "status": "ok" }`.

## Tech Stack

| Layer      | Technology           |
|------------|---------------------|
| Frontend   | React 18 + Vite 5   |
| Styling    | Vanilla CSS (Glassmorphism) |
| HTTP Client| Axios               |
| Backend    | Node.js + Express 4 |
| Database   | MongoDB Atlas (M0)  |
| Validation | express-validator   |
| Hashing    | bcryptjs            |
```
