# ApplyFlow

A mobile job application tracking app for students, junior developers, and professionals. Track applications, interview stages, follow-ups, and notes in a clean, organized way.

## Tech Stack

- **React Native** + **Expo**
- **TypeScript**
- **React Navigation** (Stack)
- **AsyncStorage** for local persistence
- Functional components only

## Installation

1. **Clone and install dependencies:**

```bash
cd applyflow
npm install
```

2. **Run the app:**

**Option A – Development build (recommended for notifications on Android):**

Expo Go on Android no longer supports notifications (SDK 53+). Use a development build:

```bash
npx expo run:android
```

Or for iOS:

```bash
npx expo run:ios
```

**Option B – Expo Go (no notifications on Android):**

```bash
npx expo start
```

- Press `i` for iOS Simulator (notifications work)
- Press `a` for Android Emulator
- Scan the QR code with **Expo Go** (notifications will not work on Android)

## Project Structure

```
src/
├── components/       # Reusable UI components
├── context/          # React Context (JobsProvider)
├── hooks/            # useJobs custom hook
├── navigation/       # App navigator setup
├── screens/          # Dashboard, AddJob, JobDetails
├── storage/          # AsyncStorage logic
├── types/            # TypeScript types
└── utils/            # Helpers (dates, constants)
```

## AsyncStorage Logic

- **Storage key:** `@applyflow_jobs`
- **Format:** JSON array of job objects
- **Flow:**
  1. `loadJobs()` reads from AsyncStorage on app load
  2. `saveJobs(jobs)` writes the full array after each add/update/delete
  3. `useJobs` hook manages state and syncs with storage
  4. All mutations (add, update, delete) persist immediately

## Features

- **Dashboard:** Summary cards (Total, Interviews, Offers, Rejections, Interview %, Offer %), jobs grouped by status
- **Add Job:** Full form with company, role, type, location, salary, dates, status, notes
- **Job Details:** Edit all fields, delete application
- **Follow-up:** Cards with overdue follow-up dates show "Follow Up Needed" badge

## Screens

1. **Dashboard** – Overview and job list by status  
2. **Add Job** – Create new application  
3. **Job Details** – View, edit, or delete application  
