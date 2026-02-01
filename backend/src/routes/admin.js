import { Router } from 'express';
import { resetAll, getTeamsWithPlayers, getWaitlist, removeTeam } from '../database.js';
import { handleWin, handleDraw, getGameState } from '../services/teamFormation.js';

const router = Router();

// Reset all teams and waitlist
router.post('/reset', (req, res) => {
  try {
    resetAll();
    
    // Emit update via socket
    if (req.io) {
      req.io.emit('game:update');
    }
    
    res.json({ 
      success: true, 
      message: 'All teams, players, and waitlist have been reset' 
    });
  } catch (error) {
    console.error('Error resetting:', error);
    res.status(500).json({ error: 'Failed to reset' });
  }
});

// Declare a winner and rotate teams
router.post('/win', (req, res) => {
  const { winnerPosition } = req.body;
  
  if (!winnerPosition || (winnerPosition !== 1 && winnerPosition !== 2)) {
    return res.status(400).json({ error: 'winnerPosition must be 1 or 2' });
  }
  
  try {
    const result = handleWin(winnerPosition);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // Emit update via socket
    if (req.io) {
      req.io.emit('game:update');
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error handling win:', error);
    res.status(500).json({ error: 'Failed to rotate teams' });
  }
});

// Declare a draw - both teams go off
router.post('/draw', (req, res) => {
  try {
    const result = handleDraw();
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    // Emit update via socket
    if (req.io) {
      req.io.emit('game:update');
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error handling draw:', error);
    res.status(500).json({ error: 'Failed to rotate teams' });
  }
});

// Remove a team (admin action)
router.delete('/teams/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    removeTeam(parseInt(id));
    
    // Emit update via socket
    if (req.io) {
      req.io.emit('game:update');
    }
    
    res.json({ success: true, message: 'Team removed' });
  } catch (error) {
    console.error('Error removing team:', error);
    res.status(500).json({ error: 'Failed to remove team' });
  }
});

// Get full game state (for admin dashboard)
router.get('/state', (req, res) => {
  try {
    const state = getGameState();
    const waitlist = getWaitlist();
    const allTeams = getTeamsWithPlayers();
    
    // Count incomplete teams (forming)
    const formingTeams = allTeams.filter(t => t.players.length < 7 && !t.queue_position);
    
    res.json({
      ...state,
      allTeams,
      formingTeams,
      waitlist
    });
  } catch (error) {
    console.error('Error getting state:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

export default router;
