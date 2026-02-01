import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket() {
  const [gameState, setGameState] = useState({
    playing: [],
    queued: [],
    formingTeams: [],
    waitlist: [],
    totalTeams: 0,
    canPlay: false
  });
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketInstance.on('game:update', (data) => {
      console.log('Game state updated:', data);
      if (data) {
        setGameState(data);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const refresh = useCallback(() => {
    if (socket) {
      socket.emit('refresh');
    }
  }, [socket]);

  return { 
    ...gameState,
    connected, 
    refresh 
  };
}
