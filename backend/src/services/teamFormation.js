import {
  getIncompleteTeam,
  getTeamPlayerCount,
  assignPlayerToTeam,
  getPlayer,
  removePlayer,
  createTeam,
  assignTeamToQueue,
  getTeamCount,
  getGroupPlayers,
  assignGroupToTeam,
  markGroupComplete,
  getFirstFromWaitlist,
  removeFromWaitlist,
  addPlayer,
  rotateAfterWin,
  rotateAfterDraw,
  getPlayingTeams,
  getQueuedTeams
} from '../database.js';

/**
 * Generates a team name based on count
 */
function generateTeamName(teamNumber) {
  const names = [
    'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 
    'Black', 'White', 'Gold', 'Silver', 'Crimson', 'Navy',
    'Forest', 'Sunset', 'Storm', 'Thunder', 'Lightning', 'Phoenix',
    'Dragons', 'Lions', 'Eagles', 'Wolves', 'Bears', 'Tigers'
  ];
  
  if (teamNumber <= names.length) {
    return `Team ${names[teamNumber - 1]}`;
  }
  return `Team ${teamNumber}`;
}

/**
 * Assigns a solo player to an incomplete team or creates a new team.
 * When a team reaches 7 players, it joins the queue.
 */
function assignSoloPlayer(playerId) {
  // Find an incomplete team (not currently playing)
  let incompleteTeam = getIncompleteTeam();
  
  if (incompleteTeam) {
    // Add player to existing incomplete team
    assignPlayerToTeam(playerId, incompleteTeam.id);
    
    const newCount = getTeamPlayerCount(incompleteTeam.id);
    
    // If team is now complete (7 players), add to queue
    if (newCount === 7 && !incompleteTeam.queue_position) {
      const queuePos = assignTeamToQueue(incompleteTeam.id);
      return {
        success: true,
        assigned: true,
        teamId: incompleteTeam.id,
        teamComplete: true,
        queuePosition: queuePos,
        message: `Team complete! Added to queue at position ${queuePos}`
      };
    }
    
    return {
      success: true,
      assigned: true,
      teamId: incompleteTeam.id,
      playersNeeded: 7 - newCount,
      message: `Added to team. ${7 - newCount} more players needed.`
    };
  }
  
  // No incomplete team - create a new one
  const teamCount = getTeamCount();
  const teamName = generateTeamName(teamCount + 1);
  const teamId = createTeam(teamName);
  
  // Assign player to the new team
  assignPlayerToTeam(playerId, teamId);
  
  return {
    success: true,
    assigned: true,
    teamId,
    teamName,
    playersNeeded: 6,
    message: `Started a new team: ${teamName}. 6 more players needed.`
  };
}

/**
 * Creates a team for a complete group of 7 friends.
 */
function assignGroupAsTeam(groupCode) {
  const groupPlayers = getGroupPlayers(groupCode);
  
  if (groupPlayers.length !== 7) {
    return {
      success: false,
      error: `Group needs exactly 7 players (currently has ${groupPlayers.length})`,
      currentCount: groupPlayers.length
    };
  }
  
  // Create a new team for the group
  const teamCount = getTeamCount();
  const teamName = generateTeamName(teamCount + 1);
  const teamId = createTeam(teamName);
  
  // Assign all group players to the team
  assignGroupToTeam(groupCode, teamId);
  markGroupComplete(groupCode);
  
  // Add team to queue
  const queuePos = assignTeamToQueue(teamId);
  
  return {
    success: true,
    assigned: true,
    teamId,
    teamName,
    queuePosition: queuePos,
    message: `Group formed ${teamName}! Added to queue at position ${queuePos}`
  };
}

/**
 * Handles a win result - winner stays, loser goes to back of queue.
 */
function handleWin(winnerPosition) {
  if (winnerPosition !== 1 && winnerPosition !== 2) {
    return { success: false, error: 'Winner must be position 1 or 2' };
  }
  
  const playingTeams = getPlayingTeams();
  if (playingTeams.length < 2) {
    return { success: false, error: 'Need at least 2 teams to rotate' };
  }
  
  const result = rotateAfterWin(winnerPosition);
  
  if (result.error) {
    return { success: false, error: result.error };
  }
  
  return {
    success: true,
    type: 'win',
    winner: result.winner,
    loser: result.loser,
    message: `${result.winner} wins! ${result.loser} goes to back of queue.`
  };
}

/**
 * Handles a draw result - both teams go to back of queue, next two come on.
 */
function handleDraw() {
  const playingTeams = getPlayingTeams();
  if (playingTeams.length < 2) {
    return { success: false, error: 'Need at least 2 teams to rotate' };
  }
  
  const result = rotateAfterDraw();
  
  if (result.error) {
    return { success: false, error: result.error };
  }
  
  return {
    success: true,
    type: 'draw',
    team1: result.team1,
    team2: result.team2,
    message: `Draw! Both ${result.team1} and ${result.team2} go off. Next teams up!`
  };
}

/**
 * Gets the current game state.
 */
function getGameState() {
  const playing = getPlayingTeams();
  const queued = getQueuedTeams();
  
  return {
    playing,
    queued,
    totalTeams: playing.length + queued.length,
    canPlay: playing.length >= 2
  };
}

/**
 * Checks if there are enough complete teams to start playing.
 */
function canStartMatch() {
  const playing = getPlayingTeams();
  return playing.length >= 2;
}

export {
  assignSoloPlayer,
  assignGroupAsTeam,
  handleWin,
  handleDraw,
  getGameState,
  canStartMatch,
  generateTeamName
};
