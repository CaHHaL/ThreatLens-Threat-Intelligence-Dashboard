import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export const useWebSocket = () => {
    const { accessToken } = useAuthStore();
    const [events, setEvents] = useState([]);
    const [lastEvent, setLastEvent] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const wsRef = useRef(null);
    const reconnectCount = useRef(0);
    const maxReconnects = 5;

    const connect = useCallback(() => {
        if (!accessToken) return;

        setConnectionStatus('Connecting...');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost/api';
        const isRelative = apiBase.startsWith('/');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = isRelative ? window.location.host : new URL(apiBase).host;
        const wsPrefix = isRelative ? apiBase : new URL(apiBase).pathname;

        const wsUrl = `${wsProtocol}//${wsHost}${wsPrefix}/v1/ws/feed?token=${accessToken}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setConnectionStatus('Live');
            reconnectCount.current = 0;
        };

        ws.onmessage = (event) => {
            let parsed;
            try {
                parsed = JSON.parse(event.data);
            } catch (e) { return; }

            if (parsed.type === 'ping') return; // Ignore raw heartbeats silently

            setLastEvent(parsed);
            setEvents(prev => {
                const updated = [parsed, ...prev];
                return updated.slice(0, 500); // Buffer reasonable amount natively
            });
        };

        ws.onclose = () => {
            setConnectionStatus('Reconnecting...');
            if (reconnectCount.current < maxReconnects) {
                const backoff = Math.pow(2, reconnectCount.current) * 1000;
                reconnectCount.current += 1;
                setTimeout(connect, backoff);
            } else {
                setConnectionStatus('Disconnected');
            }
        };

        ws.onerror = () => {
            ws.close();
        };

        wsRef.current = ws;
    }, [accessToken]);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [connect]);

    return { events, connectionStatus, lastEvent };
};
