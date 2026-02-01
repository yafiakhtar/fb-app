import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { initDatabase, getTeamsWithPlayers, getWaitlist, getPlayingTeams, getQueuedTeams } from './database.js';
import { getGameState } from './services/teamFormation.js';
import playersRouter from './routes/players.js';
import teamsRouter from './routes/teams.js';
import groupsRouter from './routes/groups.js';
import adminRouter from './routes/admin.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
}));
app.use(express.json());

// Attach io to request for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper function to get full game state
function getFullGameState() {
  const state = getGameState();
  const waitlist = getWaitlist();
  const allTeams = getTeamsWithPlayers();
  const formingTeams = allTeams.filter(t => t.players.length < 7 && !t.queue_position);
  
  return {
    ...state,
    formingTeams,
    waitlist
  };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send current state on connect
  socket.emit('game:update', getFullGameState());
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  
  // Client can request a refresh
  socket.on('refresh', () => {
    socket.emit('game:update', getFullGameState());
  });
});

// Override emit to fetch fresh data for game:update
const originalEmit = io.emit.bind(io);
io.emit = (event, data) => {
  if (event === 'game:update' && !data) {
    return originalEmit(event, getFullGameState());
  }
  return originalEmit(event, data);
};

// Initialize database and start server
const PORT = process.env.PORT || 3001;

initDatabase();
console.log('Database initialized');

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Socket.io enabled for real-time updates');
});
