import { Router } from 'express';
import { addPlayer, removePlayer, getPlayer } from '../database.js';
import { assignSoloPlayer } from '../services/teamFormation.js';

const router = Router();

// Solo player signup
router.post('/', (req, res) => {
  const { nickname } = req.body;
  
  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({ error: 'Nickname is required' });
  }
  
  if (nickname.length > 20) {
    return res.status(400).json({ error: 'Nickname must be 20 characters or less' });
  }
  
  try {
    const playerId = addPlayer(nickname.trim());
    const result = assignSoloPlayer(playerId);
    
    // Emit update via socket
    if (req.io) {
      req.io.emit('game:update');
    }
    
    res.status(201).json({
      id: playerId,
      nickname: nickname.trim(),
      ...result
    });
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// Remove a player (admin action)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const player = getPlayer(parseInt(id));
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const result = removePlayer(parseInt(id));
    
    // Emit update via socket
    if (req.io) {
      req.io.emit('game:update');
    }
    
    res.json({ 
      success: true, 
      message: 'Player removed',
      teamRemoved: result.teamRemoved
    });
  } catch (error) {
    console.error('Error removing player:', error);
    res.status(500).json({ error: 'Failed to remove player' });
  }
});

export default router;
