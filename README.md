# 🏫 Classroom Seating

An interactive seat assignment tool for classrooms — built with React and Vite. Automatically distributes up to 30 students across 3 rows × 5 desks using a max-distance algorithm to keep students as far apart as possible.

![screenshot](https://github.com/user-attachments/assets/7366f58a-b884-4bfd-9017-d8966ab3511c)

## Live Demo

🔗 [Open on GitHub Pages](https://dotneteeer.github.io/classroom-seating/)

## Features

- **Smart seating algorithm** — places each new student at the seat with the maximum minimum distance to already-seated students
- **5 filling stages** — seats are filled in a specific order with color-coded progress per stage
- **Persistent state** — students and seat assignments are saved to `localStorage` and restored on reload
- **Shuffle** — reassign all seats randomly at any time while keeping the same students
- **Responsive design** — works on both desktop and mobile
- **Student list** — hover over a student to highlight their seat on the map; remove individual students

## Layout

30 seats total: **3 rows** × **5 desks** × **2 variants** (V1 / V2), filled across 5 color-coded stages.

## Tech Stack

- [React 18](https://react.dev/) — UI components and state
- [Vite](https://vitejs.dev/) — build tool and dev server
- [GitHub Pages](https://pages.github.com/) — deployment via GitHub Actions

## Getting Started

```bash
npm install
npm run dev
```

## Usage

1. Enter student names in the sidebar (one per line, or separated by commas / semicolons)
2. Press **Enter** or click **Add** — students are placed automatically
3. Hover over any name in the list to highlight their seat on the map
4. Click **⟳** to reshuffle all seats
5. Click **Reset** to clear everything
