"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

export interface PlayerInfo {
  id: string;
  name: string;
}

interface GameWebSocketState {
  isConnected: boolean;
  roomCode: string | null;
  gameId: string | null;
  playerId: string | null;
  playerName: string | null;
  playersInLobby: PlayerInfo[];
  error: string | null;
  sendMessage: (type: string, payload: any) => void;
}

const GameWebSocketContext = createContext<GameWebSocketState | undefined>(
  undefined
);

const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:5217/ws";

export const GameWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [playersInLobby, setPlayersInLobby] = useState<PlayerInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already open.");
      return;
    }

    console.log(`Attempting to connect to WebSocket at ${WEBSOCKET_URL}...`);
    const socket = new WebSocket(WEBSOCKET_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const message = JSON.parse(event.data as string);
        switch (message.type) {
          case "roomCreated":
            setRoomCode(message.payload.roomCode);
            setPlayerId(message.payload.playerId);
            setPlayerNameState(message.payload.playerName);
            setGameId(message.payload.gameId);
            setPlayersInLobby([
              {
                id: message.payload.playerId,
                name: message.payload.playerName,
              },
            ]);
            setError(null);
            break;
          case "joinSuccess":
            setPlayerId(message.payload.playerId);
            setPlayerNameState(message.payload.playerName); 
            setGameId(message.payload.gameId);
            const selfPlayer: PlayerInfo = {
              id: message.payload.playerId,
              name: message.payload.playerName,
            };
            const otherPlayers = message.payload.playersInLobby as PlayerInfo[];
            setPlayersInLobby([selfPlayer, ...otherPlayers]);
            setError(null);
            break;
          case "joinFailed":
            setError(message.payload.reason);
            setRoomCode(null); 
            setGameId(null);
            setPlayerId(null);
            break;
          case "playerJoinedLobby":
            setPlayersInLobby((prevPlayers) => {
              if (!prevPlayers.find((p) => p.id === message.payload.playerId)) {
                return [
                  ...prevPlayers,
                  {
                    id: message.payload.playerId,
                    name: message.payload.playerName,
                  },
                ];
              }
              return prevPlayers;
            });
            break;
          case "playerLeftLobby":
            setPlayersInLobby((prevPlayers) =>
              prevPlayers.filter((p) => p.id !== message.payload.playerId)
            );
            break;
          default:
            console.warn("Unhandled WebSocket message type:", message.type);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message or handle it:", e);
        setError("Received an invalid message from the server.");
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError(
        "WebSocket connection error. Ensure the server is running and accessible."
      );
      setIsConnected(false);
    };

    socket.onclose = (event) => {
      console.log("WebSocket disconnected:", event.reason, event.code);
      setIsConnected(false);
      setRoomCode(null);
      setGameId(null);
      setPlayerId(null);
      setPlayerNameState(null);
      setPlayersInLobby([]);
      if (!event.wasClean) {
        setError("WebSocket connection closed unexpectedly. Please try again.");
      }
    };
  }, []);

  useEffect(() => {
    connect(); 
    return () => {
      socketRef.current?.close();
    };
  }, [connect]);

  const sendMessage = (type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      console.log("Sending WebSocket message:", message);
      socketRef.current.send(message);
    } else {
      console.error("WebSocket is not connected.");
      setError(
        "Cannot send message: WebSocket is not connected. Please wait or try reconnecting."
      );
      if (
        !socketRef.current ||
        socketRef.current.readyState === WebSocket.CLOSED
      ) {
        connect();
      }
    }
  };

  const state = {
    isConnected,
    roomCode,
    gameId,
    playerId,
    playerName, 
    playersInLobby,
    error,
    sendMessage,
  };

  const setExternalRoomCode = (code: string | null) => {
    setRoomCode(code);
  };

  return (
    <GameWebSocketContext.Provider
      value={{ ...state, setExternalRoomCode } as any}
    >
      {children}
    </GameWebSocketContext.Provider>
  );
};

export const useGameWebSocket = () => {
  const context = useContext(GameWebSocketContext);
  if (context === undefined) {
    throw new Error(
      "useGameWebSocket must be used within a GameWebSocketProvider"
    );
  }
  return context;
};
