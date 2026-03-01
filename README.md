# ApplyFlow

ApplyFlow is a mobile app for tracking job applications end-to-end.

Built for students, junior developers, and experienced professionals who apply to many roles and need one place to stay organized, follow up on time, and learn from outcomes.

## Features

- Track applications by status (`Applied`, `Interview`, `Final Round`, `Offer`, `Rejected`)
- Dashboard with key stats and recent applications
- Weekly application goal with progress and automatic weekly reset
- Insights engine:
  - Interview rate
  - Offer rate
  - Most applied role type
  - Most successful role type
  - Average days to final outcome
  - Resume-version success performance
- Reflection flow on rejection ("Reflect & Grow")
- Resume version tracking per application
- Deadlines screen for active follow-ups only (finalized applications excluded)
- Read-only details modal for finalized applications (`Offer` / `Rejected`)
- Backup and restore support:
  - Export CSV (all-time or month/year)
  - JSON backup preview + copy
  - Import from backup JSON
- Dark/Light theme toggle
- Local persistence using AsyncStorage

## Tech Stack

- Expo (Managed Workflow)
- React Native
- TypeScript
- React Navigation (Native Stack + Bottom Tabs)
- AsyncStorage

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the project:

```bash
npx expo start
```

3. Run on device/emulator using Expo options shown in terminal.

## Project Structure

```text
src/
  components/   # Reusable UI components
  context/      # Theme and jobs context
  hooks/        # Business logic via useJobs
  navigation/   # Stack + bottom tab navigation
  screens/      # Dashboard, Applications, Deadlines, DataTools, forms
  storage/      # AsyncStorage load/save + migration
  types/        # App types
  utils/        # Constants and date helpers
```

## Data Notes

- Jobs are stored locally in AsyncStorage.
- Older stored job objects are migrated safely when new fields are introduced.
- Finalized jobs remain readable but non-editable from list cards.

## License

This project is for learning and challenge submission purposes.
