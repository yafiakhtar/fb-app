# Soccer Pickup 7v7

A real-time web app for organizing pickup 7v7 soccer games with a King of the Hill rotation system.

## Features

- **Anonymous Signup**: Players join with just a nickname
- **Dynamic Teams**: Teams form automatically as players sign up (7 players per team)
- **Solo & Group Signup**: Join individually or create a group code for 7 friends
- **King of the Hill Rotation**: 
  - Two teams play at a time
  - **Win**: Winner stays on the field, loser goes to back of queue
  - **Draw**: Both teams go off, next two teams from queue come on
- **Real-time Updates**: See teams update live via WebSocket
- **Admin Controls**: Declare winners, reset games, remove players/teams

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Real-time**: Socket.io

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the App

1. Start the backend server (from the `backend` folder):
```bash
npm start
```
The server runs on http://localhost:3001

2. Start the frontend dev server (from the `frontend` folder):
```bash
npm run dev
```
The app runs on http://localhost:5173

## How It Works

### Team Formation
1. Players sign up with a nickname
2. First player starts "Team Red", next creates "Team Blue", etc.
3. Each team needs 7 players to be complete
4. Complete teams join the queue automatically

### The Game Cycle
1. The first two complete teams start playing (shown in "On the Field")
2. Other complete teams wait in the queue
3. After a match, admin clicks:
   - **[Team X Wins]**: Winner stays, loser goes to back of queue, next team comes up
   - **[Draw]**: Both teams go off, next two teams from queue come on

### Groups of Friends
1. One person clicks "Create New Group"
2. Share the 6-character code with 6 friends
3. All 7 enter the code and their nickname
4. When complete, the group forms their own team

### Admin Features
- Click "Admin Panel" at the bottom
- **Declare Winner**: Triggers rotation (winner stays, loser to back of queue)
- **Reset All Teams**: Clear everything for a new session
- **Remove Teams/Players**: Manage individual teams or players

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | Get game state (playing, queued, forming teams) |
| POST | `/api/players` | Solo player signup |
| DELETE | `/api/players/:id` | Remove player |
| POST | `/api/groups` | Create a group code |
| GET | `/api/groups/:code` | Get group info |
| POST | `/api/groups/:code/join` | Join existing group |
| POST | `/api/admin/win` | Declare winner (winner stays, loser to back) |
| POST | `/api/admin/draw` | Declare draw (both teams go off) |
| POST | `/api/admin/reset` | Reset all teams |
| DELETE | `/api/admin/teams/:id` | Remove a team |

## Project Structure

```
fb-app/
├── backend/
│   ├── src/
│   │   ├── index.js           # Express + Socket.io server
│   │   ├── database.js        # SQLite with queue management
│   │   ├── routes/
│   │   │   ├── players.js     # Player signup routes
│   │   │   ├── teams.js       # Team routes
│   │   │   ├── groups.js      # Group management
│   │   │   └── admin.js       # Admin routes (rotation, reset)
│   │   └── services/
│   │       └── teamFormation.js # Team assignment & rotation logic
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── SignupForm.jsx
│   │   │   ├── GroupSignup.jsx
│   │   │   ├── TeamsDisplay.jsx
│   │   │   ├── Waitlist.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── hooks/
│   │   │   └── useSocket.js
│   │   └── services/
│   │       └── api.js
│   └── package.json
└── README.md
```

## License

MIT
