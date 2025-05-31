"use client";

import React from "react";
import { useGameWebSocket, PlayerInfo } from "../context/game-socket-provider";

export const Lobby: React.FC = () => {
  const { roomCode, playersInLobby, playerName, playerId } = useGameWebSocket();

  if (!roomCode) {
    return <div>Error: Not in a room.</div>;
  }

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxWidth: "500px",
        margin: "20px auto",
      }}
    >
      <h2>Lobby</h2>
      <p>
        <strong>Welcome, {playerName || playerId}!</strong>
      </p>
      <p>
        Room Code:{" "}
        <strong style={{ fontSize: "1.5em", color: "#007bff" }}>
          {roomCode}
        </strong>
      </p>
      <p>Share this code with your friends to join!</p>

      <h3 style={{ marginTop: "20px" }}>
        Players in Lobby ({playersInLobby.length}/10):
      </h3>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {playersInLobby.map((player: PlayerInfo) => (
          <li
            key={player.id}
            style={{ padding: "5px 0", borderBottom: "1px dashed #eee" }}
          >
            {player.name} {player.id === playerId ? "(You)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
};
