# Wedding Seating Chart Planner

An interactive tool for couples to design their wedding venue layout and assign guests to seats.

## Features

- **Guest List Management** - Add individual guests or entire families, import from CSV, track RSVP status and meal preferences
- **Family Grouping** - Guests are automatically grouped by family; warnings appear when families are split across tables
- **Venue Designer** - Visual canvas with a dot grid where you can place, drag, resize, and rotate tables
- **Table Types** - Round, rectangular, and long/banquet tables with configurable seat counts (2-30)
- **Drag-and-Drop Seating** - Drag guests from the sidebar onto table seats; auto-seat entire families with one click
- **Dashboard** - Real-time stats: RSVP counts, meal preference breakdown, table utilization, split family warnings
- **Data Persistence** - Automatically saved to localStorage; export/import as JSON; CSV guest import
- **Print Support** - Print-friendly seating chart view

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Zustand (state management)
- @dnd-kit (drag and drop)
- Lucide React (icons)
