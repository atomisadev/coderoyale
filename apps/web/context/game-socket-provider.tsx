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
  hp?: number;
}

export interface TestCase {
  title: string;
  isTest: boolean;
  testIn: string;
  testOut: string;
  isValidator: boolean;
  needValidation?: boolean;
}

export interface ProblemDetails {
  title: string;
  statement: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string | null;
  testCases?: TestCase[];
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
  timeRemaining: number | null;
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

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
          case "newProblem":
            if (message.payload) {
              setCurrentProblem({
                title: message.payload.title,
                statement: message.payload.statement,
                inputDescription: message.payload.inputDescription,
                outputDescription: message.payload.outputDescription,
                constraints: message.payload.constraints,
                testCases: message.payload.testCases || [],
              });
              setTimeRemaining(10); // 300s = 5m
            }
            break;
          case "problemSolved":
            setTimeRemaining(null);
            break;
          case "timeUpdate":
            setTimeRemaining(message.payload.timeRemaining);
            break;
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
                hp: 100,
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
              hp: 100,
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
            setPlayersInLobby((prevPlayers: any) => {
              if (
                !prevPlayers.find((p: any) => p.id === message.payload.playerId)
              ) {
                return [
                  ...prevPlayers,
                  {
                    id: message.payload.playerId,
                    name: message.payload.playerName,
                    hp: 100,
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
            const playersWithHp = (
              message.payload.playersInGame as Omit<PlayerInfo, "hp">[]
            ).map((player) => ({
              ...player,
              hp: 100,
            }));
            setPlayersInGame(playersWithHp);
            setPlayersInLobby([]);
            setCurrentProblem(null);
            setError(null);
            break;
          case "playerHpUpdate":
            console.log("HP Update received:", message.payload);
            setPlayersInGame((prevPlayers) =>
              prevPlayers.map((player) =>
                player.id === message.payload.playerId
                  ? {
                      ...player,
                      hp: message.payload.hp,
                    }
                  : player
              )
            );
            break;
          case "problemTimeout":
            setTimeRemaining(null);
            console.log("Problem timeout received from server");
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
      }
    }
  };

  useEffect(() => {
    if (timeRemaining == null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev == null || prev <= 1) {
          // sendMessage("problemTimeout", {});
          console.log("Timer expired on client side");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, sendMessage]);

  const setExternalRoomCodeCallback = useCallback((code: string | null) => {
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

  const value: GameWebSocketState = {
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
    timeRemaining,
  };

  return (
    <GameWebSocketContext.Provider value={value}>
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
