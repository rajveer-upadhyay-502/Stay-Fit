# STAY-FIT: Preventive Health Tracker

STAY-FIT is a comprehensive preventive health tracking application featuring a React Native (Expo) frontend and a Node.js/Express backend powered by MongoDB. It provides user authentication via Firebase Phone/OTP, a detailed medical onboarding workflow, a dashboard, and a digital vault for medical reports.

---

## Project Structure

```text
chota papa/
├── backend/            # Express.js REST API Server (Node/TypeScript)
│   ├── src/
│   │   ├── models/     # Mongoose Schemas (User, Profile)
│   │   ├── routes/     # Express Route Handlers (auth, profiles)
│   │   └── index.ts    # Server Entrypoint
│   ├── .env            # Environment Variables (Ignored in Git)
│   └── package.json
└── frontend/           # React Native App (Expo/TypeScript)
    ├── src/
    │   ├── navigation/ # React Navigation Config (AppNavigator)
    │   ├── screens/    # Screen Components (Auth: Login, OTP, Onboarding; Main: Dashboard, Vault)
    │   └── App.tsx     # App Container
    ├── firebaseConfig.ts # Firebase SDK Initialization
    └── package.json
```

---

## Features

- **Phone Authentication with OTP**: Secure login using Firebase Phone Auth on the client side, verified and registered via the backend database.
- **Multi-Step Onboarding Form**: 
  - **General Info**: Name, Age, and Gender.
  - **Physical Vitals**: Height, Weight, and Blood Group.
  - **Medical History**: Comma-separated list of pre-existing conditions.
- **Report Vault & Dashboard**: Shell components ready for report upload, storage, and health tracking visualization.

---

## Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (either running locally on port 27017 or a cloud database instance on MongoDB Atlas)

---

## Setup & Running the Project

### 1. Run the Backend Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Open/create the `.env` file in the `backend/` folder and configure it:
   ```env
   PORT=8000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stayfit
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY=your-private-key
   STORAGE_PATH=./uploads
   GOOGLE_CLOUD_VISION_API_KEY=your-vision-api-key
   ```
4. Start the server in development (hot-reload) mode:
   ```bash
   npm run dev
   ```
   *The server runs on [http://localhost:8000](http://localhost:8000). You should see `Connected to MongoDB` and `Server is running on port 8000` in the terminal.*

---

### 2. Run the Frontend (Expo App)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your Firebase settings in `frontend/firebaseConfig.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
4. Start the Expo development server:
   - To run in **Web Mode** (recommended for quick testing in browser):
     ```bash
     npm run web
     ```
     *This will launch the app at [http://localhost:8081](http://localhost:8081).*
   
   - To run in **Android Mode** (requires Android emulator or a physical device running Expo Go):
     ```bash
     npm run android
     ```

   - To run in **iOS Mode** (requires macOS and iOS simulator):
     ```bash
     npm run ios
     ```

---

## API Documentation (Backend)

The backend exposes the following key endpoints:

| Endpoint | Method | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Health check endpoint | N/A |
| `/api/auth/verify` | `POST` | Authenticates / Registers user based on Firebase UID | `{ firebaseUid, phoneNumber, email }` |
| `/api/profiles` | `POST` | Creates a new medical profile for a user | `{ userId, name, age, gender, height, weight, bloodGroup, preExistingConditions, isPrimary }` |
| `/api/profiles/:userId` | `GET` | Gets all profiles associated with the `userId` | N/A |
