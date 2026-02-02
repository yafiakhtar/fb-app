# Soccer Pickup 7v7

A web app for organizing pickup 7v7 soccer games at universities. Features real-time updates, dynamic team formation, and a King of the Hill rotation system.

## Features

- **Anonymous Sign-up**: Join with just a nickname
- **Solo or Group**: Sign up alone or bring 7 friends to form an instant team
- **King of the Hill**: Winner stays on the field, loser goes to back of queue
- **Draw Option**: Both teams go off, next two teams come on
- **Real-time Updates**: See team changes instantly via Supabase Realtime
- **Admin Controls**: Manage matches, declare winners, reset game

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (Postgres)
- **Real-time**: Supabase Realtime

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run this schema:

```sql
-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  queue_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table  
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  nickname TEXT NOT NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  group_code TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  code TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_complete BOOLEAN DEFAULT FALSE
);

-- Enable realtime on tables
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
```

4. Go to **Settings > API** and copy your:
   - Project URL
   - Anon public key

### 2. Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Supabase credentials to .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Start dev server
npm run dev
```

### 3. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## How It Works

### Team Formation
- **Solo players** are added to incomplete teams (teams with < 7 players)
- When a team reaches 7 players, it joins the queue
- **Groups** create their own team instantly when 7 players join with the same code

### Game Cycle (King of the Hill)
1. First two complete teams start on the field (positions 1 and 2)
2. After a match, admin declares result:
   - **Win**: Winner stays, loser goes to back of queue
   - **Draw**: Both teams go to back, next two teams come on
3. Next team from queue takes the empty position

## Project Structure

```
fb-app/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # React hooks (useGameState)
│   └── services/           # API client
├── api/                    # Vercel serverless functions
│   ├── players.js          # Add/remove players
│   ├── teams.js            # Get game state
│   ├── groups.js           # Create/get groups
│   ├── groups/[code]/      # Dynamic group routes
│   └── admin/              # Admin actions
├── lib/                    # Shared utilities
│   └── supabase.js         # Supabase client
├── package.json
├── vite.config.js
└── vercel.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/players` | Add solo player |
| DELETE | `/api/players` | Remove player |
| GET | `/api/teams` | Get game state |
| POST | `/api/groups` | Create group |
| GET | `/api/groups?code=XXX` | Get group info |
| POST | `/api/groups/[code]/join` | Join group |
| POST | `/api/admin/win` | Declare winner |
| POST | `/api/admin/draw` | Declare draw |
| POST | `/api/admin/reset` | Reset all data |
| DELETE | `/api/admin/teams` | Remove team |
