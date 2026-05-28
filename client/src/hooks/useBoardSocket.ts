import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';

/**
 * Hook to manage Socket.IO connection for a specific board room.
 * Handles automatic query invalidations in TanStack Query for all board events.
 */
export const useBoardSocket = (boardId: string) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (!boardId) return;

    const socket = getSocket();

    const onConnect = () => {
      setStatus('connected');
      console.log('[SOCKET] Connected to realtime server');
      socket.emit('join_board', { boardId });
    };

    const onDisconnect = (reason: string) => {
      setStatus('disconnected');
      console.log('[SOCKET] Disconnected:', reason);
    };

    const onConnectError = (err: any) => {
      setStatus('disconnected');
      console.error('[SOCKET] Connection error:', err);
    };

    // Bind connection states
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Acknowledgment
    socket.on('board_joined', (data) => {
      console.log('[SOCKET] Joined room successfully:', data);
    });

    // --- Task Events ---
    socket.on('task_created', (task) => {
      console.log('[SOCKET] Task created event received:', task);
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    });

    socket.on('task_updated', (task) => {
      console.log('[SOCKET] Task updated event received:', task);
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      if (task && (task.id || task._id)) {
        const taskId = task.id || task._id;
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      }
    });

    socket.on('task_deleted', (payload) => {
      console.log('[SOCKET] Task deleted event received:', payload);
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
      if (payload && payload.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', payload.taskId] });
      }
    });

    socket.on('task_moved', (task) => {
      console.log('[SOCKET] Task moved event received:', task);
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    });

    // --- List Events ---
    socket.on('list_created', (list) => {
      console.log('[SOCKET] List created event received:', list);
      queryClient.invalidateQueries({ queryKey: ['lists', boardId] });
    });

    socket.on('list_updated', (list) => {
      console.log('[SOCKET] List updated event received:', list);
      queryClient.invalidateQueries({ queryKey: ['lists', boardId] });
    });

    socket.on('list_deleted', (payload) => {
      console.log('[SOCKET] List deleted event received:', payload);
      queryClient.invalidateQueries({ queryKey: ['lists', boardId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    });

    socket.on('lists_reordered', (payload) => {
      console.log('[SOCKET] Lists reordered event received:', payload);
      queryClient.invalidateQueries({ queryKey: ['lists', boardId] });
    });

    // --- Board Events ---
    socket.on('board_updated', (board) => {
      console.log('[SOCKET] Board updated event received:', board);
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    });

    // --- Comment Events ---
    socket.on('comment_created', (comment) => {
      console.log('[SOCKET] Comment created event received:', comment);
      if (comment && comment.taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', comment.taskId.toString()] });
      }
    });

    socket.on('comment_updated', (comment) => {
      console.log('[SOCKET] Comment updated event received:', comment);
      if (comment && comment.taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', comment.taskId.toString()] });
      }
    });

    socket.on('comment_deleted', (payload) => {
      console.log('[SOCKET] Comment deleted event received:', payload);
      if (payload && payload.taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', payload.taskId] });
      }
    });

    // --- Notification & Activity Events ---
    socket.on('notification_created', (notification) => {
      console.log('[SOCKET] Notification created event received:', notification);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('activity_created', (activity) => {
      console.log('[SOCKET] Activity created event received:', activity);
      queryClient.invalidateQueries({ queryKey: ['activity-logs', 'board', boardId] });
      if (activity && activity.taskId) {
        queryClient.invalidateQueries({ queryKey: ['activity-logs', 'task', activity.taskId.toString()] });
      }
    });

    // Initiate connection
    if (!socket.connected) {
      setStatus('connecting');
      socket.connect();
    } else {
      setStatus('connected');
      socket.emit('join_board', { boardId });
    }

    // Cleanup logic
    return () => {
      console.log('[SOCKET] Cleaning up listeners and leaving board:', boardId);
      
      socket.emit('leave_board', { boardId });

      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('board_joined');
      
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
      socket.off('task_moved');
      
      socket.off('list_created');
      socket.off('list_updated');
      socket.off('list_deleted');
      socket.off('lists_reordered');
      
      socket.off('board_updated');
      
      socket.off('comment_created');
      socket.off('comment_updated');
      socket.off('comment_deleted');

      socket.off('notification_created');
      socket.off('activity_created');

      socket.disconnect();
      setStatus('disconnected');
    };
  }, [boardId, queryClient]);

  return { status };
};
