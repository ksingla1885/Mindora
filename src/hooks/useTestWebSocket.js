import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function useTestWebSocket(testId, onUpdate) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const socketRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!testId || !session?.user?.id) return;

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: { token: session.user.id },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Join test room
    socketRef.current.emit('join-test', {
      testId,
      userId: session.user.id,
    });

    // Set up event listeners
    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketRef.current.on('test-update', (data) => {
      if (data.userId !== session.user.id) {
        onUpdate?.(data);
      }
    });

    socketRef.current.on('user-joined', ({ userId }) => {
      if (userId !== session.user.id) {
        toast({
          title: 'Proctor Alert',
          description: 'A proctor has joined the test session',
          variant: 'default',
        });
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [testId, session?.user?.id]);

  // Send answer update
  const sendAnswerUpdate = useCallback((questionId, answer) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected');
      return false;
    }

    socketRef.current.emit('update-answer', {
      testId,
      questionId,
      answer,
      userId: session?.user?.id,
    });

    return true;
  }, [testId, session?.user?.id]);

  return {
    sendAnswerUpdate,
    isConnected: socketRef.current?.connected || false,
  };
}
