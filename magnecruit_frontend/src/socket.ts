import io from 'socket.io-client';

// For local dev: 'http://localhost:5000'
// For production: 'https://your-production-backend-url.com'
const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-backend-url.com' 
  : 'http://localhost:5000'; 

export const socket = io(BACKEND_URL, {
    autoConnect: false,
});

socket.on('connect', () => { console.log('Socket connected:', socket.id); });
socket.on('disconnect', (reason) => { console.log('Socket disconnected:', reason); });
socket.on('connect_error', (error) => { console.error('Socket connection error:', error); });