
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
=======
