import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '..', 'soccer.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  // Create teams table with queue position
  // queue_position 1 and 2 = currently playing
  // queue_position 3+ = waiting in queue
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      queue_position INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create players table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      team_id INTEGER,
      group_code TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )
  `);

  // Create groups table (for friends arriving together)
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      code TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_complete BOOLEAN DEFAULT 0
    )
  `);

  // Create waitlist table (for players waiting for a team to form)
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Team queries
function getAllTeams() {
  return db.prepare('SELECT * FROM teams ORDER BY queue_position').all();
}

function getTeamsWithPlayers() {
  const teams = db.prepare('SELECT * FROM teams ORDER BY queue_position').all();
  const players = db.prepare('SELECT * FROM players WHERE team_id IS NOT NULL ORDER BY joined_at').all();
  
  return teams.map(team => ({
    ...team,
    players: players.filter(p => p.team_id === team.id)
  }));
}

function getPlayingTeams() {
  // Teams with queue_position 1 and 2 are currently playing
  const teams = db.prepare('SELECT * FROM teams WHERE queue_position IN (1, 2) ORDER BY queue_position').all();
  const players = db.prepare('SELECT * FROM players WHERE team_id IS NOT NULL ORDER BY joined_at').all();
  
  return teams.map(team => ({
    ...team,
    players: players.filter(p => p.team_id === team.id)
  }));
}

function getQueuedTeams() {
  // Teams with queue_position > 2 are waiting
  const teams = db.prepare('SELECT * FROM teams WHERE queue_position > 2 ORDER BY queue_position').all();
  const players = db.prepare('SELECT * FROM players WHERE team_id IS NOT NULL ORDER BY joined_at').all();
  
  return teams.map(team => ({
    ...team,
    players: players.filter(p => p.team_id === team.id)
  }));
}

function getTeamPlayerCount(teamId) {
  const result = db.prepare('SELECT COUNT(*) as count FROM players WHERE team_id = ?').get(teamId);
  return result.count;
}

function getIncompleteTeam() {
  // Find a team that has less than 7 players and is not currently playing (queue_position > 2 or null)
  const teams = db.prepare(`
    SELECT t.id, t.queue_position, COUNT(p.id) as playerCount
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    WHERE t.queue_position IS NULL OR t.queue_position > 2
    GROUP BY t.id
    HAVING playerCount < 7
    ORDER BY t.created_at
    LIMIT 1
  `).get();
  
  return teams || null;
}

function getNextQueuePosition() {
  const result = db.prepare('SELECT MAX(queue_position) as maxPos FROM teams').get();
  return (result.maxPos || 0) + 1;
}

function createTeam(name) {
  const result = db.prepare('INSERT INTO teams (name, queue_position) VALUES (?, ?)').run(name, null);
  return result.lastInsertRowid;
}

function assignTeamToQueue(teamId) {
  const nextPosition = getNextQueuePosition();
  db.prepare('UPDATE teams SET queue_position = ? WHERE id = ?').run(nextPosition, teamId);
  return nextPosition;
}

function getTeamCount() {
  const result = db.prepare('SELECT COUNT(*) as count FROM teams').get();
  return result.count;
}

function getTeamById(teamId) {
  return db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
}

function updateTeamQueuePosition(teamId, position) {
  db.prepare('UPDATE teams SET queue_position = ? WHERE id = ?').run(position, teamId);
}

// Rotation functions
function rotateAfterWin(winnerPosition) {
  // Winner stays at position 1
  // Loser goes to back of queue
  // Next team moves up to position 2
  
  const loserPosition = winnerPosition === 1 ? 2 : 1;
  
  const winner = db.prepare('SELECT * FROM teams WHERE queue_position = ?').get(winnerPosition);
  const loser = db.prepare('SELECT * FROM teams WHERE queue_position = ?').get(loserPosition);
  const allTeams = db.prepare('SELECT * FROM teams WHERE queue_position IS NOT NULL ORDER BY queue_position').all();
  
  if (!winner || !loser || allTeams.length < 2) {
    return { error: 'Not enough teams to rotate' };
  }
  
  // Move winner to position 1
  db.prepare('UPDATE teams SET queue_position = 1 WHERE id = ?').run(winner.id);
  
  // Move all teams after position 2 up by one
  const teamsToShift = db.prepare('SELECT * FROM teams WHERE queue_position > 2 ORDER BY queue_position').all();
  
  if (teamsToShift.length > 0) {
    // Next team becomes position 2
    db.prepare('UPDATE teams SET queue_position = 2 WHERE id = ?').run(teamsToShift[0].id);
    
    // Shift remaining teams up
    for (let i = 1; i < teamsToShift.length; i++) {
      db.prepare('UPDATE teams SET queue_position = ? WHERE id = ?').run(i + 2, teamsToShift[i].id);
    }
    
    // Loser goes to the end
    db.prepare('UPDATE teams SET queue_position = ? WHERE id = ?').run(teamsToShift.length + 2, loser.id);
  } else {
    // Only 2 teams, just swap if needed
    db.prepare('UPDATE teams SET queue_position = 2 WHERE id = ?').run(loser.id);
  }
  
  return { success: true, winner: winner.name, loser: loser.name };
}

function rotateAfterDraw() {
  // Both teams go to back of queue
  // Next two teams come on to play
  
  const team1 = db.prepare('SELECT * FROM teams WHERE queue_position = 1').get();
  const team2 = db.prepare('SELECT * FROM teams WHERE queue_position = 2').get();
  const allTeams = db.prepare('SELECT * FROM teams WHERE queue_position IS NOT NULL ORDER BY queue_position').all();
  
  if (!team1 || !team2 || allTeams.length < 2) {
    return { error: 'Not enough teams to rotate' };
  }
  
  const teamsInQueue = db.prepare('SELECT * FROM teams WHERE queue_position > 2 ORDER BY queue_position').all();
  
  if (teamsInQueue.length >= 2) {
    // Move first two from queue to positions 1 and 2
    db.prepare('UPDATE teams SET queue_position = 1 WHERE id = ?').run(teamsInQueue[0].id);
    db.prepare('UPDATE teams SET queue_position = 2 WHERE id = ?').run(teamsInQueue[1].id);
    
    // Shift remaining queue teams up
    for (let i = 2; i < teamsInQueue.length; i++) {
      db.prepare('UPDATE teams SET queue_position = ? WHERE id = ?').run(i + 1, teamsInQueue[i].id);
    }
    
    // Both playing teams go to end
    const newEndPosition = teamsInQueue.length + 1;
    db.prepare('UPDATE teams SET queue_position = ? WHERE id = ?').run(newEndPosition, team1.id);
    db.prepare('UPDATE teams SET queue_position = ? WHERE id = ?').run(newEndPosition + 1, team2.id);
  } else if (teamsInQueue.length === 1) {
    // Only 1 team in queue - it becomes position 1, team1 becomes 2, team2 goes to end
    db.prepare('UPDATE teams SET queue_position = 1 WHERE id = ?').run(teamsInQueue[0].id);
    db.prepare('UPDATE teams SET queue_position = 2 WHERE id = ?').run(team1.id);
    db.prepare('UPDATE teams SET queue_position = 3 WHERE id = ?').run(team2.id);
  } else {
    // No teams in queue - just swap positions
    db.prepare('UPDATE teams SET queue_position = 1 WHERE id = ?').run(team2.id);
    db.prepare('UPDATE teams SET queue_position = 2 WHERE id = ?').run(team1.id);
  }
  
  return { success: true, team1: team1.name, team2: team2.name };
}

// Player queries
function addPlayer(nickname, groupCode = null) {
  const result = db.prepare('INSERT INTO players (nickname, group_code) VALUES (?, ?)').run(nickname, groupCode);
  return result.lastInsertRowid;
}

function assignPlayerToTeam(playerId, teamId) {
  db.prepare('UPDATE players SET team_id = ? WHERE id = ?').run(teamId, playerId);
}

function getPlayer(playerId) {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
}

function removePlayer(playerId) {
  const player = getPlayer(playerId);
  if (player && player.team_id) {
    // Check if this leaves the team empty
    const teamPlayerCount = getTeamPlayerCount(player.team_id);
    if (teamPlayerCount === 1) {
      // This is the last player, remove the team too
      db.prepare('DELETE FROM players WHERE id = ?').run(playerId);
      removeTeam(player.team_id);
      return { teamRemoved: true };
    }
  }
  db.prepare('DELETE FROM players WHERE id = ?').run(playerId);
  return { teamRemoved: false };
}

function removeTeam(teamId) {
  const team = getTeamById(teamId);
  if (!team) return;
  
  // Remove all players from the team
  db.prepare('DELETE FROM players WHERE team_id = ?').run(teamId);
  
  // Get the team's position before removing
  const removedPosition = team.queue_position;
  
  // Remove the team
  db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
  
  // Shift all teams after this position up by one
  if (removedPosition) {
    db.prepare('UPDATE teams SET queue_position = queue_position - 1 WHERE queue_position > ?').run(removedPosition);
  }
}

function getUnassignedPlayers() {
  return db.prepare('SELECT * FROM players WHERE team_id IS NULL ORDER BY joined_at').all();
}

// Group queries
function createGroup(code) {
  db.prepare('INSERT INTO groups (code) VALUES (?)').run(code);
}

function getGroup(code) {
  return db.prepare('SELECT * FROM groups WHERE code = ?').get(code);
}

function getGroupPlayers(groupCode) {
  return db.prepare('SELECT * FROM players WHERE group_code = ?').all(groupCode);
}

function markGroupComplete(code) {
  db.prepare('UPDATE groups SET is_complete = 1 WHERE code = ?').run(code);
}

function assignGroupToTeam(groupCode, teamId) {
  db.prepare('UPDATE players SET team_id = ? WHERE group_code = ?').run(teamId, groupCode);
}

// Waitlist queries
function addToWaitlist(nickname) {
  const result = db.prepare('INSERT INTO waitlist (nickname) VALUES (?)').run(nickname);
  return result.lastInsertRowid;
}

function getWaitlist() {
  return db.prepare('SELECT * FROM waitlist ORDER BY added_at').all();
}

function removeFromWaitlist(id) {
  db.prepare('DELETE FROM waitlist WHERE id = ?').run(id);
}

function getFirstFromWaitlist() {
  return db.prepare('SELECT * FROM waitlist ORDER BY added_at LIMIT 1').get();
}

// Admin queries
function resetAll() {
  db.prepare('DELETE FROM players').run();
  db.prepare('DELETE FROM waitlist').run();
  db.prepare('DELETE FROM groups').run();
  db.prepare('DELETE FROM teams').run();
}

export {
  db,
  initDatabase,
  getAllTeams,
  getTeamsWithPlayers,
  getPlayingTeams,
  getQueuedTeams,
  getTeamPlayerCount,
  getIncompleteTeam,
  getNextQueuePosition,
  createTeam,
  assignTeamToQueue,
  getTeamCount,
  getTeamById,
  updateTeamQueuePosition,
  rotateAfterWin,
  rotateAfterDraw,
  addPlayer,
  assignPlayerToTeam,
  getPlayer,
  removePlayer,
  removeTeam,
  getUnassignedPlayers,
  createGroup,
  getGroup,
  getGroupPlayers,
  markGroupComplete,
  assignGroupToTeam,
  addToWaitlist,
  getWaitlist,
  removeFromWaitlist,
  getFirstFromWaitlist,
  resetAll
};
