import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { getGameState } from '../services/api';

export function useGameState() {
  const [gameState, setGameState] = useState({
    playing: [],
    queued: [],
    formingTeams: [],
    waitlist: [],
    totalTeams: 0,
    canPlay: false,
  });
  const [connected, setConnected] = useState(false);

  const fetchGameState = useCallback(async () => {
    try {
      const state = await getGameState();
      setGameState(state);
    } catch (error) {
      console.error('Failed to fetch game state:', error);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchGameState();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('game-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        () => {
          fetchGameState();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => {
          fetchGameState();
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGameState]);

  return {
    ...gameState,
    connected,
    refresh: fetchGameState,
  };
}
