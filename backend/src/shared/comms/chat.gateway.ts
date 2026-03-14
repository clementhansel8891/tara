import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    const userId = client.handshake.query.userId as string;

    if (tenantId && userId) {
      // Logic for user presence can be added here
      client.join(`tenant_${tenantId}`);
      client.join(`user_${userId}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; body: string; tenantId: string; userId: string },
  ) {
    const message = await this.chatService.sendMessage({
      tenantId: payload.tenantId,
      roomId: payload.roomId,
      senderId: payload.userId,
      body: payload.body,
    });

    // Part 7: broadcast newMessage
    this.server.to(`room_${payload.roomId}`).emit('newMessage', message);
  }

  @SubscribeMessage('messageDelivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string },
  ) {
    const updated = await this.chatService.updateMessageStatus(payload.messageId, 'DELIVERED');
    // Notify sender that message was delivered
    this.server.to(`user_${updated.senderId}`).emit('messageStatusUpdated', updated);
  }

  @SubscribeMessage('messagesRead')
  async handleMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string, userId: string },
  ) {
    await this.chatService.markAsRead(payload.roomId, payload.userId);
    // Broadcast status change to room members
    this.server.to(`room_${payload.roomId}`).emit('roomRead', { roomId: payload.roomId, userId: payload.userId });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, roomId: string) {
    client.join(`room_${roomId}`);
    return { status: 'joined', roomId };
  }
}
