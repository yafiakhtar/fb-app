import { Router } from 'express';
import { nanoid } from 'nanoid';
import { createGroup, getGroup, getGroupPlayers, addPlayer } from '../database.js';
import { assignGroupAsTeam } from '../services/teamFormation.js';

const router = Router();

// Create a new group code
router.post('/', (req, res) => {
  try {
    // Generate a short, readable group code
    const code = nanoid(6).toUpperCase();
    createGroup(code);
    
    res.status(201).json({
      code,
      message: 'Share this code with your friends to join the group'
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get group info
router.get('/:code', (req, res) => {
  const { code } = req.params;
  
  try {
    const group = getGroup(code.toUpperCase());
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const players = getGroupPlayers(code.toUpperCase());
    
    res.json({
      code: group.code,
      isComplete: group.is_complete,
      players,
      playerCount: players.length,
      slotsNeeded: 7 - players.length
    });
  } catch (error) {
    console.error('Error getting group:', error);
    res.status(500).json({ error: 'Failed to get group' });
  }
});

// Join a group with a nickname
router.post('/:code/join', (req, res) => {
  const { code } = req.params;
  const { nickname } = req.body;
  
  if (!nickname || nickname.trim().length === 0) {
    return res.status(400).json({ error: 'Nickname is required' });
  }
  
  if (nickname.length > 20) {
    return res.status(400).json({ error: 'Nickname must be 20 characters or less' });
  }
  
  try {
    const group = getGroup(code.toUpperCase());
    if (!group) {
      return res.status(404).json({ error: 'Group not found. Check your code.' });
    }
    
    if (group.is_complete) {
      return res.status(400).json({ error: 'This group is already complete and assigned to a team' });
    }
    
    const currentPlayers = getGroupPlayers(code.toUpperCase());
    if (currentPlayers.length >= 7) {
      return res.status(400).json({ error: 'Group is already full (7 players)' });
    }
    
    // Add player to the group (not assigned to team yet)
    const playerId = addPlayer(nickname.trim(), code.toUpperCase());
    
    const updatedPlayers = getGroupPlayers(code.toUpperCase());
    
    let assignmentResult = null;
    
    // If group now has 7 players, create a team and add to queue
    if (updatedPlayers.length === 7) {
      assignmentResult = assignGroupAsTeam(code.toUpperCase());
      
      // Emit update via socket
      if (req.io) {
        req.io.emit('game:update');
      }
    }
    
    res.status(201).json({
      id: playerId,
      nickname: nickname.trim(),
      groupCode: code.toUpperCase(),
      playerCount: updatedPlayers.length,
      slotsNeeded: 7 - updatedPlayers.length,
      players: updatedPlayers,
      assignment: assignmentResult
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

export default router;
