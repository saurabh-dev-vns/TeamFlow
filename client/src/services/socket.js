import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

// Auth now travels via the httpOnly cookie (withCredentials), so the client
// no longer needs to hold or pass the JWT itself for the socket handshake.
export const connectSocket = () => {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
