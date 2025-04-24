// magnecruit_frontend\src\socket.ts

import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_REACT_APP_SOCKET_URL;

export const socket = io(SOCKET_URL, {
    autoConnect: false,
});

socket.on('connect', () => { console.log('Socket connected:', socket.id); });
socket.on('disconnect', (reason) => { console.log('Socket disconnected:', reason); });
socket.on('connect_error', (error) => { console.error('Socket connection error:', error); });