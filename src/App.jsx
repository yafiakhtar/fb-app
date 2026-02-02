import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import SignupForm from './components/SignupForm';
import GroupSignup from './components/GroupSignup';
import TeamsDisplay from './components/TeamsDisplay';
import Waitlist from './components/Waitlist';
import AdminPanel from './components/AdminPanel';

function App() {
  const { playing, queued, formingTeams, waitlist, totalTeams, canPlay, connected, refresh } = useGameState();
  const [showAdmin, setShowAdmin] = useState(false);
  const [signupMode, setSignupMode] = useState('solo'); // 'solo' | 'group'

  return (
    <div className="app">
      <header className="header">
        <h1>Soccer Pickup 7v7</h1>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </header>

      <main className="main">
        <section className="signup-section">
          <h2>Join the Game</h2>
          
          <div className="signup-tabs">
            <button 
              className={`tab ${signupMode === 'solo' ? 'active' : ''}`}
              onClick={() => setSignupMode('solo')}
            >
              Solo Player
            </button>
            <button 
              className={`tab ${signupMode === 'group' ? 'active' : ''}`}
              onClick={() => setSignupMode('group')}
            >
              Group of Friends
            </button>
          </div>

          {signupMode === 'solo' ? (
            <SignupForm onSuccess={refresh} />
          ) : (
            <GroupSignup onSuccess={refresh} />
          )}

          <p className="slots-info">
            {totalTeams} team{totalTeams !== 1 ? 's' : ''} formed
            {formingTeams.length > 0 && ` | ${formingTeams.length} team${formingTeams.length !== 1 ? 's' : ''} forming`}
          </p>
        </section>

        {/* Currently Playing */}
        {playing.length > 0 && (
          <section className="playing-section">
            <h2>On the Field</h2>
            {canPlay ? (
              <TeamsDisplay teams={playing} isPlaying={true} />
            ) : (
              <div className="waiting-message">
                <p>Waiting for more teams to be ready...</p>
                <TeamsDisplay teams={playing} isPlaying={true} />
              </div>
            )}
          </section>
        )}

        {/* Teams in Queue */}
        {queued.length > 0 && (
          <section className="queue-section">
            <h2>In Queue ({queued.length} team{queued.length !== 1 ? 's' : ''} waiting)</h2>
            <TeamsDisplay teams={queued} isPlaying={false} showQueuePosition={true} />
          </section>
        )}

        {/* Teams Still Forming */}
        {formingTeams.length > 0 && (
          <section className="forming-section">
            <h2>Teams Forming</h2>
            <TeamsDisplay teams={formingTeams} isPlaying={false} isForming={true} />
          </section>
        )}

        {/* Waitlist */}
        {waitlist.length > 0 && (
          <section className="waitlist-section">
            <h2>Waitlist</h2>
            <Waitlist waitlist={waitlist} />
          </section>
        )}

        {/* Empty State */}
        {totalTeams === 0 && formingTeams.length === 0 && (
          <section className="empty-section">
            <div className="empty-state">
              <h3>No Teams Yet</h3>
              <p>Be the first to sign up and start forming a team!</p>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <button 
          className="admin-toggle"
          onClick={() => setShowAdmin(!showAdmin)}
        >
          {showAdmin ? 'Hide Admin' : 'Admin Panel'}
        </button>
      </footer>

      {showAdmin && (
        <AdminPanel 
          playing={playing}
          queued={queued}
          formingTeams={formingTeams}
          waitlist={waitlist}
          canPlay={canPlay}
          onAction={refresh}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}

export default App;
