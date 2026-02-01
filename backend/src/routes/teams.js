import { Router } from 'express';
import { getTeamsWithPlayers, getWaitlist, getPlayingTeams, getQueuedTeams } from '../database.js';
import { getGameState } from '../services/teamFormation.js';

const router = Router();

// Get full game state (playing teams, queued teams)
router.get('/', (req, res) => {
  try {
    const state = getGameState();
    const waitlist = getWaitlist();
    
    res.json({
      ...state,
      waitlist
    });
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Get all teams with players (for admin)
router.get('/all', (req, res) => {
  try {
    const teams = getTeamsWithPlayers();
    res.json({ teams });
  } catch (error) {
    console.error('Error getting all teams:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Get waitlist
router.get('/waitlist', (req, res) => {
  try {
    const waitlist = getWaitlist();
    res.json({ waitlist });
  } catch (error) {
    console.error('Error getting waitlist:', error);
    res.status(500).json({ error: 'Failed to get waitlist' });
  }
});

export default router;
