# STAY-FIT Project Audit & Analysis Report

This document contains a comprehensive review of the **STAY-FIT Preventive Health Tracker** codebase, mapping existing features, highlighting critical security vulnerabilities, identifying functional bugs, and offering an action plan to transition the app from a prototype/MVP to a production-ready application.

---

## 1. Project Overview & Architecture

The project is structured as a monorepo consisting of:
- **Backend**: Express REST API server using TypeScript, MongoDB (via Mongoose), and Firebase Admin (installed but unconfigured).
- **Frontend**: React Native mobile app using Expo, TypeScript, React Navigation, and client-side Firebase SDK.

---

## 2. Feature Mapping (Implemented vs. Mocked)

While the UI is styled premiumly, many key features are mocked or simulated:

| Feature Area | Description | Implementation Status |
| :--- | :--- | :--- |
| **Phone Authentication** | Verification of phone numbers using Firebase OTP. | **Implemented** (Client-side OTP verification is live; Backend verify route registers users). |
| **Google Sign-In (Web)** | Firebase OAuth popup authentication. | **Implemented** (Client-side popup is live). |
| **Google Sign-In (Mobile)** | Native Google authentication in Expo Go. | **Mocked / Bypassed** (Displays alert dialog with mock credentials to avoid native library compiler issues). |
| **Medical Onboarding** | General, Physical, and History profile collection. | **Implemented** (3-step wizard saves profile to MongoDB). |
| **Daily Activity Tracker** | Interactive pedometer displaying steps, distance, flights. | **Simulated** (Manual stepper buttons to add/remove 1,000 steps; other metrics are static or hardcoded formulas). |
| **Digital Report Vault** | History of medical records & key parameters extraction. | **Simulated / Mocked** (Buttons to scan, upload, or connect run `setTimeout` and save static mock parameters like CBC panel, thyroid profile, HealthKit records). |
| **Overall Health Index** | Percentage display of health score on Dashboard (84%). | **Mocked / Static** (Hardcoded text/ring in the UI). |
| **Trajectory & Forecast** | 6-month vital projections and recommendations. | **Mocked / Static** (Weight values decrement linearly, recommendations are hardcoded lists). |

---

## 3. Critical Security Vulnerabilities & Loopholes

> [!CAUTION]
> **These issues pose extreme data security risks and must be fixed before deploying the app or storing real user data.**

### A. Account Takeover / Account Hijacking in `/verify` Route
* **Location**: [backend/src/routes/auth.ts (Lines 17-46)](file:///c:/Users/urajv/Desktop/chota%20papa/backend/src/routes/auth.ts#L17-L46)
* **Description**:
  The verify endpoint uses an `$or` query to look up existing users by `firebaseUid`, `email`, or `phoneNumber`. If a record matches *any* of these fields, the server updates that user's record with the incoming `firebaseUid`.
* **Exploitation Scenario**:
  An attacker can call `/verify` with their own `firebaseUid` and a victim's `email` or `phoneNumber`. The database will match the victim's email, see that the database user's `firebaseUid` differs from the request body, and overwrite the victim's database `firebaseUid` with the attacker's UID. The attacker is now permanently logged into the victim's account.

### B. Total Lack of API Authorization
* **Location**: [backend/src/routes/profiles.ts](file:///c:/Users/urajv/Desktop/chota%20papa/backend/src/routes/profiles.ts), [backend/src/routes/reports.ts](file:///c:/Users/urajv/Desktop/chota%20papa/backend/src/routes/reports.ts), [backend/src/routes/activities.ts](file:///c:/Users/urajv/Desktop/chota%20papa/backend/src/routes/activities.ts)
* **Description**:
  None of the endpoints verify the caller's identity. There is no auth middleware or Bearer token header check. Anyone can query, update, or create profiles, reports, and activity logs for *any* user in the database simply by guessing or iterating their MongoDB `userId` (which is publicly visible in client requests).

### C. Hardcoded MongoDB Credentials in Git Tracked File
* **Location**: [backend/.env](file:///c:/Users/urajv/Desktop/chota%20papa/backend/.env#L2)
* **Description**:
  The active `.env` file contains plaintext username and password for a live MongoDB Atlas cluster:
  `MONGODB_URI=mongodb+srv://urajveer7:RAJVEER2005@cluster0.ee1qjqm.mongodb.net/...`
  Because this file is checked in or saved locally in plaintext, anyone with source-code access can access the database, manipulate tables, or delete data.

### D. Hardcoded Mock Google Auth Credentials (Expo Go Mobile Bypasses)
* **Location**: [frontend/src/screens/Auth/LoginScreen.tsx (Lines 117-157)](file:///c:/Users/urajv/Desktop/chota%20papa/frontend/src/screens/Auth/LoginScreen.tsx#L117-L157)
* **Description**:
  On mobile devices (Expo Go), Google Sign-In is simulated via an Alert popup. Selecting "Continue as..." sends a request to the backend with a hardcoded mock UID (`google_expo_go_mock_uid_urajveer7`) and email (`urajveer7@gmail.com`). This constitutes a functional backdoor that bypasses authentication.

---

## 4. Functional Bugs & Edge Cases

### A. Stale Dashboard Vitals (No Page-Focus Listeners)
* **Location**: [frontend/src/screens/Main/DashboardScreen.tsx (Lines 13-15)](file:///c:/Users/urajv/Desktop/chota%20papa/frontend/src/screens/Main/DashboardScreen.tsx#L13-L15)
* **Description**:
  The dashboard fetches user health records only on screen mounting. Since the screens are organized in a bottom tab navigator, they do not unmount when switching tabs.
  * **Result**: If a user updates their step counts in the Activity screen and navigates back to the Dashboard, the step progress bar and metric count on the dashboard remain stale until the app is restarted.

### B. Poor UX: returning authenticated users always see Welcome walkthrough slides
* **Location**: [frontend/src/navigation/AppNavigator.tsx (Line 100)](file:///c:/Users/urajv/Desktop/chota%20papa/frontend/src/navigation/AppNavigator.tsx#L100)
* **Description**:
  The stack navigator specifies `initialRouteName="Welcome"`. On every single app launch, an authenticated user must click through the onboarding slides or tap "SKIP" to reach the `LoginScreen`, which is the only screen that listens to Firebase's `onAuthStateChanged` to auto-redirect them.
  * **Fix**: The auth state check should occur on the splash screen or root `AppNavigator` component to instantly redirect logged-in users to `Main`.

### C. Database Crashes / CastErrors on Invalid API Request Parameters
* **Location**: Backend controller endpoints that query by User ID.
* **Description**:
  Endpoints like `GET /api/profiles/:userId` query MongoDB using a raw string parameter. If a user inputs a malformed ID string (or a Firebase UID) that is not a valid 24-character hex MongoDB ObjectId, Mongoose throws a `CastError`.
  * **Result**: The backend returns a `500 Internal Server Error` instead of a validation-related `400 Bad Request`.

### D. Activity Route Crash on Invalid Dates
* **Location**: [backend/src/routes/activities.ts (Lines 15-17)](file:///c:/Users/urajv/Desktop/chota%20papa/backend/src/routes/activities.ts#L15-L17)
* **Description**:
  The backend parses dates using `new Date(date)`. If an invalid date string is sent in the body, `new Date(date)` results in `Invalid Date`. Calling `activityDate.setUTCHours(0, 0, 0, 0)` returns `NaN`. When MongoDB executes the query `Activity.findOneAndUpdate`, it throws a database cast exception and returns a `500 Error`.

### E. Redundant API Latency (Multiple Backend Redirection Loop)
* **Location**: [frontend/src/screens/Main/ReportTimelineScreen.tsx](file:///c:/Users/urajv/Desktop/chota%20papa/frontend/src/screens/Main/ReportTimelineScreen.tsx), [frontend/src/screens/Main/DailyActivityScreen.tsx](file:///c:/Users/urajv/Desktop/chota%20papa/frontend/src/screens/Main/DailyActivityScreen.tsx)
* **Description**:
  To query database logs, the frontend does not store the MongoDB User ID in global context. Instead, it hits the verify endpoint `/api/auth/verify` using the Firebase UID to fetch the MongoDB `userId`, and then calls `/api/reports/:userId`. This creates nested API dependency chains, doubling network latencies and backend workloads.

### F. Hardcoded Mobile Network IP Bindings
* **Location**: [frontend/src/config.ts (Line 5)](file:///c:/Users/urajv/Desktop/chota%20papa/frontend/src/config.ts#L5)
* **Description**:
  The developer machine IP address is hardcoded to `'192.168.0.101'`. If the local Wi-Fi router assigns a different subnet address, physical mobile devices running the Expo client will fail to connect. This configuration belongs in environment configurations.

---

## 5. Architectural Improvements & Quality Recommendations

### 1. Database Model Cleanup (Dead Code)
* The [frontend/src/screens/Main/VaultScreen.tsx](file:///c:/Users/urajv/Desktop/chota%20papa/frontend/src/screens/Main/VaultScreen.tsx) is completely unused in [AppNavigator.tsx](file:///c:/Users/urajv/Desktop/chota%20papa/frontend/src/navigation/AppNavigator.tsx) navigation screens, serving as dead code. It should either be integrated or deleted.
* The `multer` library is listed in `backend/package.json` dependencies but is never imported or utilized in report upload routes.

### 2. Form Input Validation
* **Manual Report Modal**: The manual report addition form on the Report Timeline does not validate the date string (requires YYYY-MM-DD). Malformed inputs trigger server crashes.

---

## 6. Recommended Action Plan

```mermaid
graph TD
    A[Fix Verify Route / Account Hijack] --> B[Implement Authentication Middleware]
    B --> C[Fix App Navigator Route Redirection]
    C --> D[Add Page Focus Listeners in Dashboard]
    D --> E[Validate User IDs & Date Objects on Backend]
    E --> F[Move Env Keys & IP Config to System Env]
```

1. **Secure `/verify` Route**: Update the database search logic. Find by `firebaseUid` first; only link accounts through explicit verification prompts instead of automatic `$or` merging.
2. **Setup Firebase Admin Auth Middleware**: Use the already-installed `firebase-admin` library on the backend to verify the client's bearer token in request headers. Reject requests missing valid credentials.
3. **Move Router State to Splash Page**: Initialize Firebase auth state during splash rendering to ensure returning users transition directly to `Main` instead of sliding through walkthrough screens.
4. **Implement Navigation Event Listeners**: Replace empty `useEffect` arrays in Dashboard with focus handlers so steps and vitals synchronize seamlessly across navigation tabs.
5. **Add Global User Context**: Cache the user's MongoDB ObjectId locally or globally in the React Native state during initial verification to avoid nested fetch loops.
