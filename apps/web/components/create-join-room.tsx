"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useGameWebSocket } from "../context/game-socket-provider";
import { Button } from "@/components/ui/button";

interface CreateJoinRoomProps {
  initialRoomCode?: string;
}

export const CreateJoinRoom: React.FC<CreateJoinRoomProps> = ({
  initialRoomCode,
}) => {
  const { sendMessage, error, setExternalRoomCode } = useGameWebSocket() as any;
  const [playerName, setPlayerName] = useState("");
  const [inputRoomCode, setInputRoomCode] = useState(initialRoomCode || "");

  useEffect(() => {
    if (initialRoomCode && !inputRoomCode) {
      setInputRoomCode(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode, inputRoomCode]);

  const createRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!name.trim()) {
        throw new Error("Player name cannot be empty.");
      }
      sendMessage("createRoom", { playerName: name });
    },
    onError: (err: Error) => {
      console.error("Create room error:", err.message);
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (params: { name: string; code: string }) => {
      if (!params.name.trim()) {
        throw new Error("Player name cannot be empty.");
      }
      if (!params.code.trim()) {
        throw new Error("Room code cannot be empty.");
      }
      // setExternalRoomCode(params.code); // this caused me so many fucking problems
      sendMessage("joinRoom", {
        playerName: params.name,
        roomCode: params.code,
      });
    },
    onError: (err: Error) => {
      console.error("Join room error:", err.message);
    },  
  });

  const handleCreateRoom = () => {
    createRoomMutation.mutate(playerName);
  };

  const handleJoinRoom = () => {
    joinRoomMutation.mutate({ name: playerName, code: inputRoomCode });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h2>Code Royale</h2>
      <div>
        <label htmlFor="playerName">Player Name: </label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          style={{ padding: "8px", marginRight: "10px", color: "black" }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <Button
          onClick={handleCreateRoom}
          disabled={createRoomMutation.isPending || !playerName.trim()}
        >
          {createRoomMutation.isPending ? "Creating..." : "Create Room"}
        </Button>
      </div>

      <div
        style={{
          borderTop: "1px solid #ccc",
          paddingTop: "20px",
          marginTop: "20px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <p>Or Join an Existing Room:</p>
        <input
          type="text"
          value={inputRoomCode}
          onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter Room Code"
          maxLength={5}
          style={{ padding: "8px", marginRight: "10px", color: "black" }}
        />
        <Button
          onClick={handleJoinRoom}
          disabled={
            joinRoomMutation.isPending ||
            !playerName.trim() ||
            !inputRoomCode.trim()
          }
        >
          {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
        </Button>
      </div>

      {(createRoomMutation.error || joinRoomMutation.error || error) && (
        <p style={{ color: "red", marginTop: "10px" }}>
          Error:{" "}
          {createRoomMutation.error?.message ||
            joinRoomMutation.error?.message ||
            error}
        </p>
      )}
    </div>
  );
};
