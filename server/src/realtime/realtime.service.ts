import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server;
  private readonly logger = new Logger('RealtimeService');

  /**
   * Bind the main Socket.IO server instance to this service
   */
  setServer(server: Server) {
    this.server = server;
    this.logger.log('Socket.IO Server instance successfully bound to RealtimeService.');
  }

  /**
   * Emit an event to a specific board's room: `board:${boardId}`
   */
  emitToBoard(boardId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn(`Could not emit event ${event} to board ${boardId} - WebSocket server not initialized yet.`);
      return;
    }
    
    const roomName = `board:${boardId}`;
    this.logger.log(`[EMIT] Emitting "${event}" to Room: "${roomName}"`);
    
    // Broadcast to room
    this.server.to(roomName).emit(event, payload);
  }

  /**
   * Emit an event to a specific user's private room: `user:${userId}`
   */
  emitToUser(userId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn(`Could not emit event ${event} to user ${userId} - WebSocket server not initialized yet.`);
      return;
    }

    const roomName = `user:${userId}`;
    this.logger.log(`[EMIT] Emitting "${event}" to User Room: "${roomName}"`);

    // Broadcast to private user room
    this.server.to(roomName).emit(event, payload);
  }
}
