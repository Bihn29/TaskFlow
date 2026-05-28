import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseFilters } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('RealtimeGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly realtimeService: RealtimeService,
  ) {}

  afterInit(server: Server) {
    // Bind server to RealtimeService
    this.realtimeService.setServer(server);
    this.logger.log('WebSocket Gateway initialized successfully.');
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connection request: Socket ID ${client.id}`);
      
      // Extract auth token from handshake
      let token = client.handshake.auth?.token;
      
      if (!token) {
        // Fallback: extract from headers authorization
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token) {
        this.logger.warn(`Connection rejected for socket ${client.id} - No authentication token provided.`);
        client.disconnect(true);
        return;
      }

      // If token has "Bearer " prefix in handshake auth, clean it up
      if (token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      // Verify JWT
      const secret = this.configService.get<string>('JWT_SECRET') || 'fallbackSecret';
      const payload = await this.jwtService.verifyAsync(token, { secret });

      // Save user details to socket session
      client.data.user = {
        userId: payload.sub,
        email: payload.email,
      };

      // Automatically join user-specific room for private notifications
      const userRoom = `user:${payload.sub}`;
      client.join(userRoom);

      this.logger.log(`Client authenticated successfully: User ID ${payload.sub}, Socket ID ${client.id}, Joined Room: ${userRoom}`);
    } catch (err) {
      this.logger.warn(`Connection rejected for socket ${client.id} - JWT Validation failed: ${err.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user;
    this.logger.log(`Client disconnected: Socket ID ${client.id} ${user ? `(User: ${user.userId})` : '(Unauthenticated)'}`);
  }

  @SubscribeMessage('join_board')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    const user = client.data?.user;
    if (!user) {
      this.logger.warn(`join_board ignored for socket ${client.id} - client is not authenticated.`);
      return;
    }

    const { boardId } = data;
    if (!boardId) {
      this.logger.warn(`join_board ignored for socket ${client.id} - missing boardId.`);
      return;
    }

    const roomName = `board:${boardId}`;
    client.join(roomName);
    this.logger.log(`User ${user.userId} joined Room: "${roomName}" (Socket: ${client.id})`);

    // Emit acknowledgment to the joiner
    client.emit('board_joined', { boardId, status: 'success' });
  }

  @SubscribeMessage('leave_board')
  async handleLeaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    const user = client.data?.user;
    if (!user) return;

    const { boardId } = data;
    if (!boardId) return;

    const roomName = `board:${boardId}`;
    client.leave(roomName);
    this.logger.log(`User ${user.userId} left Room: "${roomName}" (Socket: ${client.id})`);

    client.emit('board_left', { boardId, status: 'success' });
  }
}
