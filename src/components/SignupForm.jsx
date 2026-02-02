import { useState } from 'react';
import { addPlayer } from '../services/api';

function SignupForm({ onSuccess }) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nickname.trim()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await addPlayer(nickname.trim());
      
      if (result.assigned) {
        setMessage({ type: 'success', text: result.message });
      } else if (result.waitlisted) {
        setMessage({ type: 'warning', text: result.message });
      }
      
      setNickname('');
      onSuccess?.();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter your nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading || !nickname.trim()}>
          {loading ? 'Joining...' : 'Join Game'}
        </button>
      </div>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </form>
  );
}

export default SignupForm;
