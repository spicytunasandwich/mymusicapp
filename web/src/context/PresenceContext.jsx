import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

const PresenceContext = createContext(null);

export function PresenceProvider({ children, currentTrack, isPlaying }) {
  const { user, isAuthenticated } = useAuth();
  const [presenceMap, setPresenceMap] = useState({}); // { [username]: { status, currentTrack, showActivity } }
  const [showActivity, setShowActivity] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connect WebSocket
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('audira_token');
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://audira-backend.onrender.com/api/v1';
    
    // Compute ws url from API base URL
    let wsUrl;
    try {
      const url = new URL(apiBase);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${url.host}/ws`;
    } catch {
      wsUrl = window.location.protocol === 'https:'
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.host}/ws`;
    }

    function connectWs() {
      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsConnected(true);
          if (token) {
            socket.send(JSON.stringify({ type: 'auth', token }));
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'auth_success') {
              if (data.user?.show_activity !== undefined) {
                setShowActivity(data.user.show_activity);
              }
            } else if (data.type === 'presence_broadcast' && data.data) {
              const info = data.data;
              if (info.username) {
                setPresenceMap(prev => ({
                  ...prev,
                  [info.username.toLowerCase()]: {
                    status: info.status,
                    currentTrack: info.currentTrack,
                    displayName: info.displayName,
                    avatarUrl: info.avatarUrl
                  }
                }));
              }
            }
          } catch (err) {
            console.warn('WS message parsing error:', err);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connectWs, 5000);
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch (err) {
        console.warn('WebSocket connection initiation failed:', err);
        reconnectTimeoutRef.current = setTimeout(connectWs, 8000);
      }
    }

    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [isAuthenticated]);

  // Sync listening activity whenever currentTrack or isPlaying changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const payload = {
      type: 'presence',
      status: isPlaying ? 'online' : 'idle',
      currentTrack: isPlaying && currentTrack ? {
        title: currentTrack.title,
        artist: currentTrack.artist_name || 'Linear Artist',
        album: currentTrack.album_title || '',
        cover_url: currentTrack.cover_url || ''
      } : null
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      // Fallback via HTTP REST
      api.put('/users/presence', {
        status: payload.status,
        currentTrack: payload.currentTrack
      }).catch(() => {});
    }
  }, [currentTrack?.id, isPlaying, isAuthenticated]);

  // Toggle "Listening to X" Privacy
  const toggleActivityPrivacy = async (enabled) => {
    setShowActivity(enabled);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'privacy_toggle',
        showActivity: enabled
      }));
    } else {
      await api.put('/users/presence', { showActivity: enabled }).catch(() => {});
    }
  };

  const getPresence = (username) => {
    if (!username) return { status: 'offline', currentTrack: null };
    return presenceMap[username.toLowerCase()] || { status: 'online', currentTrack: null };
  };

  return (
    <PresenceContext.Provider value={{
      presenceMap,
      getPresence,
      showActivity,
      toggleActivityPrivacy,
      wsConnected
    }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    return {
      presenceMap: {},
      getPresence: () => ({ status: 'offline', currentTrack: null }),
      showActivity: true,
      toggleActivityPrivacy: () => {},
      wsConnected: false
    };
  }
  return context;
}
