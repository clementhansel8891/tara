import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api-config";

export type CollaborationPresence = {
  [clientId: string]: {
    userId: string;
    userName: string;
    position?: any;
    lastSeen: string;
  };
};

export function useCollaboration(fileId: string | null, userId: string, userName: string) {
  const socketRef = useRef<Socket | null>(null);
  const [presence, setPresence] = useState<CollaborationPresence>({});
  const [lastChange, setLastChange] = useState<any>(null);

  useEffect(() => {
    if (!fileId) return;

    // Derive socket URL from API_BASE_URL
    // If API_BASE_URL is relative (/api), use current window origin
    const socketUrl = API_BASE_URL.startsWith("http") 
      ? API_BASE_URL.replace("/api", "") 
      : window.location.origin;

    const socket = io(`${socketUrl}/collaboration`, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_file", { fileId, userId, userName });
    });

    socket.on("presence_updated", (data: CollaborationPresence) => {
      setPresence(data);
    });

    socket.on("file_changed", (change: any) => {
      setLastChange(change);
    });

    return () => {
      socket.disconnect();
    };
  }, [fileId, userId, userName]);

  const broadcastChange = (change: any) => {
    if (socketRef.current && fileId) {
      socketRef.current.emit("sync_change", { fileId, change });
    }
  };

  const broadcastCursor = (position: any) => {
    if (socketRef.current && fileId) {
      socketRef.current.emit("cursor_move", { fileId, userId, position });
    }
  };

  return { presence, lastChange, broadcastChange, broadcastCursor };
}
