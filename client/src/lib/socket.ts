import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Returns a client-side Socket.IO instance.
 * Updates the authentication token dynamically on every retrieval.
 */
export const getSocket = (): Socket => {
  if (typeof window === 'undefined') {
    // Return a dummy connection or no-op during Server-Side Rendering (SSR)
    return io(SOCKET_URL, { autoConnect: false });
  }

  const token = localStorage.getItem('accessToken');

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: token || undefined,
      },
      autoConnect: false,
    });
  } else {
    // Proactively refresh auth token if user logged in or out
    socket.auth = {
      token: token || undefined,
    };
  }

  return socket;
};
