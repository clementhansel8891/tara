import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "collaboration",
})
@Injectable()
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger("CollaborationGateway");
  
  // Track users in files: { fileId: { userId: { name: string, cursor: any } } }
  private presence: Record<string, Record<string, any>> = {};

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Cleanup presence on disconnect
    Object.keys(this.presence).forEach((fileId) => {
      if (this.presence[fileId][client.id]) {
        delete this.presence[fileId][client.id];
        this.broadcastPresence(fileId);
      }
    });
  }

  @SubscribeMessage("join_file")
  handleJoinFile(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { fileId: string; userId: string; userName: string },
  ) {
    const { fileId, userId, userName } = data;
    client.join(fileId);
    
    if (!this.presence[fileId]) this.presence[fileId] = {};
    this.presence[fileId][client.id] = { userId, userName, lastSeen: new Date() };
    
    this.logger.log(`User ${userName} joined file ${fileId}`);
    this.broadcastPresence(fileId);
  }

  @SubscribeMessage("sync_change")
  handleSyncChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { fileId: string; change: any },
  ) {
    // Broadcast change to everyone else in the file
    client.to(data.fileId).emit("file_changed", data.change);
  }

  @SubscribeMessage("cursor_move")
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { fileId: string; userId: string; position: any },
  ) {
    if (this.presence[data.fileId]?.[client.id]) {
      this.presence[data.fileId][client.id].position = data.position;
      client.to(data.fileId).emit("presence_updated", this.presence[data.fileId]);
    }
  }

  private broadcastPresence(fileId: string) {
    this.server.to(fileId).emit("presence_updated", this.presence[fileId]);
  }
}
