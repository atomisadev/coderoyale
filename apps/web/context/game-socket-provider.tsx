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

export interface ProblemDetails {
  title: string;
  statement: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string | null;
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
  isGameStarted: boolean;
  playersInGame: PlayerInfo[];
  hostPlayerId: string | null;
  currentProblem: ProblemDetails | null;
  setExternalRoomCode: (code: string | null) => void;
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

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [playersInGame, setPlayersInGame] = useState<PlayerInfo[]>([]);
  const [hostPlayerId, setHostPlayerId] = useState<string | null>(null);
  const [currentProblem, setCurrentProblem] = useState<ProblemDetails | null>(
    null
  );

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
            setHostPlayerId(message.payload.hostPlayerId);
            setPlayersInLobby([
              {
                id: message.payload.playerId,
                name: message.payload.playerName,
              },
            ]);
            setIsGameStarted(false);
            setPlayersInGame([]);
            setCurrentProblem(null);
            setError(null);
            break;
          case "joinSuccess":
            setRoomCode(message.payload.roomCode);
            setPlayerId(message.payload.playerId);
            setPlayerNameState(message.payload.playerName);
            setGameId(message.payload.gameId);
            setHostPlayerId(message.payload.hostPlayerId);
            const selfPlayer: PlayerInfo = {
              id: message.payload.playerId,
              name: message.payload.playerName,
            };
            const otherPlayers = (message.payload.playersInLobby ||
              []) as PlayerInfo[];
            setPlayersInLobby([selfPlayer, ...otherPlayers]);
            setIsGameStarted(false);
            setPlayersInGame([]);
            setCurrentProblem(null);
            setError(null);
            break;
          case "joinFailed":
            setError(message.payload.reason);
            setRoomCode(null);
            setGameId(null);
            setPlayerId(null);
            setCurrentProblem(null);
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
            if (isGameStarted) {
              setPlayersInGame((prevPlayers) =>
                prevPlayers.filter((p) => p.id !== message.payload.playerId)
              );
            }
            break;
          case "gameStarted":
            setIsGameStarted(true);
            setPlayersInGame(message.payload.playersInGame as PlayerInfo[]);
            setPlayersInLobby([]);
            setCurrentProblem(null);
            setError(null);
            break;
          case "newProblem":
            if (message.payload) {
              setCurrentProblem({
                title: message.payload.title,
                statement: message.payload.statement,
                inputDescription: message.payload.inputDescription,
                outputDescription: message.payload.outputDescription,
                constraints: message.payload.constraints,
              });
            }
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
      setHostPlayerId(null);
      setIsGameStarted(false);
      setPlayersInGame([]);
      setCurrentProblem(null);
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
        console.log(
          "Attempting to reconnect due to send message on closed socket..."
        );
        // connect();
      }
    }
  };

  const setExternalRoomCodeCallback = useCallback((code: string | null) => {
    // setRoomCode(null);
    if (code) {
      //maybe reset player id or sm
    } else {
      setGameId(null);
      setPlayerId(null);
      setPlayerNameState(null);
      setPlayersInLobby([]);
      setHostPlayerId(null);
      setIsGameStarted(false);
      setPlayersInGame([]);
      setCurrentProblem(null);
    }
  }, []);

  const state = {
    isConnected,
    roomCode,
    gameId,
    playerId,
    playerName,
    playersInLobby,
    error,
    sendMessage,
    isGameStarted,
    playersInGame,
    hostPlayerId,
    currentProblem,
    setExternalRoomCode: setExternalRoomCodeCallback,
  };

  const setExternalRoomCode = (code: string | null) => {
    setRoomCode(code);
  };

  return (
    <GameWebSocketContext.Provider value={state as any}>
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
