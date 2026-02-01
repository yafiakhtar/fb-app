function TeamsDisplay({ teams, isPlaying = false, isForming = false, showQueuePosition = false }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="teams-loading">
        No teams yet...
      </div>
    );
  }

  return (
    <div className={`teams-grid ${isPlaying ? 'playing' : ''}`}>
      {teams.map((team, index) => (
        <div 
          key={team.id} 
          className={`team-card ${isPlaying ? 'on-field' : ''} ${isForming ? 'forming' : ''}`}
        >
          <div className="team-header">
            <h3>
              {showQueuePosition && (
                <span className="queue-position">#{team.queue_position - 2}</span>
              )}
              {team.name}
            </h3>
            <span className="player-count">
              {team.players.length}/7
            </span>
          </div>
          
          {isPlaying && (
            <div className="playing-badge">
              {team.queue_position === 1 ? 'Field 1' : 'Field 2'}
            </div>
          )}
          
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(team.players.length / 7) * 100}%` }}
            />
          </div>
          
          <ul className="player-list">
            {team.players.map((player, idx) => (
              <li key={player.id} className="player-item">
                <span className="player-number">{idx + 1}</span>
                <span className="player-name">{player.nickname}</span>
              </li>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: 7 - team.players.length }).map((_, idx) => (
              <li key={`empty-${idx}`} className="player-item empty">
                <span className="player-number">{team.players.length + idx + 1}</span>
                <span className="player-name">Open slot</span>
              </li>
            ))}
          </ul>
          
          {team.players.length === 7 ? (
            <div className={`team-status ${isPlaying ? 'playing' : 'ready'}`}>
              {isPlaying ? 'Playing Now!' : 'Ready to Play'}
            </div>
          ) : (
            <div className="team-status forming">
              {7 - team.players.length} more player{7 - team.players.length !== 1 ? 's' : ''} needed
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TeamsDisplay;
