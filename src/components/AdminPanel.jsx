import { useState } from 'react';
import { resetGame, removePlayer, declareWin, declareDraw, removeTeam } from '../services/api';

function AdminPanel({ playing, queued, formingTeams, waitlist, canPlay, onAction, onClose }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all teams and the waitlist? This cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await resetGame();
      setMessage({ type: 'success', text: 'Game reset successfully!' });
      onAction?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareWinner = async (position) => {
    const teamName = playing.find(t => t.queue_position === position)?.name || `Position ${position}`;
    const loserName = playing.find(t => t.queue_position !== position)?.name || 'the other team';
    if (!window.confirm(`${teamName} wins! ${loserName} will go to the back of the queue.`)) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await declareWin(position);
      setMessage({ type: 'success', text: result.message });
      onAction?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareDraw = async () => {
    const team1 = playing[0]?.name || 'Team 1';
    const team2 = playing[1]?.name || 'Team 2';
    if (!window.confirm(`It's a draw! Both ${team1} and ${team2} will go off and the next teams will come on.`)) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await declareDraw();
      setMessage({ type: 'success', text: result.message });
      onAction?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId, nickname) => {
    if (!window.confirm(`Remove ${nickname}?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      await removePlayer(playerId);
      onAction?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeam = async (teamId, teamName) => {
    if (!window.confirm(`Remove ${teamName} and all its players?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      await removeTeam(teamId);
      onAction?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const allTeams = [...playing, ...queued, ...formingTeams];
  const totalPlayers = allTeams.reduce((acc, team) => acc + team.players.length, 0);

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="admin-stats">
          <div className="stat">
            <span className="stat-value">{allTeams.length}</span>
            <span className="stat-label">Teams</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalPlayers}</span>
            <span className="stat-label">Players</span>
          </div>
          <div className="stat">
            <span className="stat-value">{queued.length}</span>
            <span className="stat-label">In Queue</span>
          </div>
          <div className="stat">
            <span className="stat-value">{waitlist.length}</span>
            <span className="stat-label">Waitlist</span>
          </div>
        </div>

        {canPlay && playing.length >= 2 && (
          <div className="match-controls">
            <h3>Match Result</h3>
            <p className="match-info">
              {playing[0]?.name} vs {playing[1]?.name}
            </p>
            <div className="result-buttons">
              <button 
                className="winner-btn"
                onClick={() => handleDeclareWinner(1)}
                disabled={loading}
              >
                {playing[0]?.name} Wins
              </button>
              <button 
                className="draw-btn"
                onClick={handleDeclareDraw}
                disabled={loading}
              >
                Draw
              </button>
              <button 
                className="winner-btn"
                onClick={() => handleDeclareWinner(2)}
                disabled={loading}
              >
                {playing[1]?.name} Wins
              </button>
            </div>
            <p className="hint">Win: Winner stays, loser to back of queue</p>
            <p className="hint">Draw: Both teams go off, next two come on</p>
          </div>
        )}

        {!canPlay && (
          <div className="match-controls inactive">
            <h3>Match Result</h3>
            <p className="waiting-text">Waiting for 2 complete teams to start a match...</p>
          </div>
        )}
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="admin-actions">
          <button 
            className="reset-btn"
            onClick={handleReset}
            disabled={loading}
          >
            Reset All Teams
          </button>
        </div>
        
        <div className="admin-teams">
          <h3>All Teams</h3>
          
          {playing.length > 0 && (
            <div className="team-group">
              <h4>Playing Now</h4>
              {playing.map(team => (
                <TeamRow 
                  key={team.id} 
                  team={team} 
                  onRemovePlayer={handleRemovePlayer}
                  onRemoveTeam={handleRemoveTeam}
                  loading={loading}
                />
              ))}
            </div>
          )}
          
          {queued.length > 0 && (
            <div className="team-group">
              <h4>In Queue</h4>
              {queued.map(team => (
                <TeamRow 
                  key={team.id} 
                  team={team} 
                  showQueuePos={true}
                  onRemovePlayer={handleRemovePlayer}
                  onRemoveTeam={handleRemoveTeam}
                  loading={loading}
                />
              ))}
            </div>
          )}
          
          {formingTeams.length > 0 && (
            <div className="team-group">
              <h4>Forming</h4>
              {formingTeams.map(team => (
                <TeamRow 
                  key={team.id} 
                  team={team} 
                  onRemovePlayer={handleRemovePlayer}
                  onRemoveTeam={handleRemoveTeam}
                  loading={loading}
                />
              ))}
            </div>
          )}
          
          {allTeams.length === 0 && (
            <p className="no-teams">No teams yet</p>
          )}
        </div>
        
        {waitlist.length > 0 && (
          <div className="admin-waitlist">
            <h3>Waitlist ({waitlist.length})</h3>
            <ul>
              {waitlist.map((person, index) => (
                <li key={person.id}>
                  <span>{index + 1}. {person.nickname}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamRow({ team, showQueuePos, onRemovePlayer, onRemoveTeam, loading }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="admin-team">
      <div className="team-row-header" onClick={() => setExpanded(!expanded)}>
        <span className="team-name">
          {showQueuePos && <span className="queue-num">#{team.queue_position - 2}</span>}
          {team.name}
        </span>
        <span className="team-count">{team.players.length}/7</span>
        <button 
          className="remove-team-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveTeam(team.id, team.name);
          }}
          disabled={loading}
        >
          Remove Team
        </button>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <ul className="team-players">
          {team.players.map(player => (
            <li key={player.id}>
              <span>{player.nickname}</span>
              <button 
                className="remove-btn"
                onClick={() => onRemovePlayer(player.id, player.nickname)}
                disabled={loading}
              >
                Remove
              </button>
            </li>
          ))}
          {team.players.length === 0 && (
            <li className="no-players">No players</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default AdminPanel;
