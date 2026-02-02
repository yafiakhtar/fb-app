import { useState } from 'react';
import { createGroup, joinGroup, getGroup } from '../services/api';

function GroupSignup({ onSuccess }) {
  const [mode, setMode] = useState('choose');
  const [groupCode, setGroupCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleCreateGroup = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await createGroup();
      setGroupCode(result.code);
      setMode('created');
      setMessage({ type: 'success', text: 'Group created! Share the code with your friends.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLookupGroup = async () => {
    if (!inputCode.trim()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const info = await getGroup(inputCode.trim().toUpperCase());
      setGroupInfo(info);
      setGroupCode(info.code);
      setMode('join');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    
    if (!nickname.trim() || !groupCode) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await joinGroup(groupCode, nickname.trim());
      
      setGroupInfo({
        ...result,
        code: groupCode
      });
      
      if (result.assignment?.success) {
        setMessage({ type: 'success', text: result.assignment.message });
      } else {
        setMessage({ 
          type: 'info', 
          text: `Joined group! ${result.slotsNeeded} more player${result.slotsNeeded !== 1 ? 's' : ''} needed.` 
        });
      }
      
      setNickname('');
      onSuccess?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMode('choose');
    setGroupCode('');
    setInputCode('');
    setNickname('');
    setGroupInfo(null);
    setMessage(null);
  };

  if (mode === 'choose') {
    return (
      <div className="group-signup">
        <p className="group-info-text">
          Bring 7 friends to form your own team instantly!
        </p>
        
        <div className="group-options">
          <button 
            className="group-btn create"
            onClick={handleCreateGroup}
            disabled={loading}
          >
            Create New Group
          </button>
          
          <div className="divider">or</div>
          
          <div className="join-existing">
            <input
              type="text"
              placeholder="Enter group code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button 
              onClick={handleLookupGroup}
              disabled={loading || !inputCode.trim()}
            >
              Find Group
            </button>
          </div>
        </div>
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'created') {
    return (
      <div className="group-signup">
        <div className="group-code-display">
          <p>Your group code:</p>
          <div className="code">{groupCode}</div>
          <p className="hint">Share this code with your friends!</p>
        </div>
        
        <form className="signup-form" onSubmit={handleJoinGroup}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading || !nickname.trim()}>
              {loading ? 'Joining...' : 'Join Your Group'}
            </button>
          </div>
        </form>
        
        {groupInfo && (
          <div className="group-status">
            <p>{groupInfo.playerCount}/7 players joined</p>
            {groupInfo.players?.map(p => (
              <span key={p.id} className="player-tag">{p.nickname}</span>
            ))}
          </div>
        )}
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <button className="back-btn" onClick={resetForm}>
          Back
        </button>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="group-signup">
        <div className="group-code-display">
          <p>Joining group:</p>
          <div className="code">{groupCode}</div>
        </div>
        
        {groupInfo && (
          <div className="group-status">
            <p>{groupInfo.playerCount}/7 players</p>
            {groupInfo.players?.map(p => (
              <span key={p.id} className="player-tag">{p.nickname}</span>
            ))}
          </div>
        )}
        
        <form className="signup-form" onSubmit={handleJoinGroup}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading || !nickname.trim()}>
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </form>
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <button className="back-btn" onClick={resetForm}>
          Back
        </button>
      </div>
    );
  }

  return null;
}

export default GroupSignup;
