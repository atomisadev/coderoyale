"use client";

import React from "react";
import { useGameWebSocket, PlayerInfo } from "@/context/game-socket-provider";
import { Button } from "./ui/button";

export const GameScreen: React.FC = () => {
  const {
    playersInGame,
    roomCode,
    playerId,
    playerName,
    error: wsError,
  } = useGameWebSocket();

  if (wsError) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        Error: {wsError}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        border: "1px solid #444",
        borderRadius: "8px",
        backgroundColor: "rgba(0,0,0,0.2)",
        maxWidth: "800px",
        margin: "20px auto",
      }}
    >
      <h2>Game In Progress! - Room: {roomCode}</h2>
      <p>Player: {playerName || playerId}</p>

      <div style={{ marginTop: "20px" }}>
        <h3>Players Currently In Game: ({playersInGame.length})</h3>
        <ul
          style={{
            listStyleType: "none",
            padding: 0,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {playersInGame.map((player: PlayerInfo) => (
            <li
              key={player.id}
              style={{
                padding: "10px",
                margin: "5px 0",
                border: "1px solid #555",
                borderRadius: "4px",
                backgroundColor:
                  player.id === playerId
                    ? "hsl(var(--primary)/0.3)"
                    : "hsl(var(--secondary)/0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                {player.name} {player.id === playerId ? "(You)" : ""}
              </span>
              <span>Score: 0</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          border: "1px dashed #666",
          minHeight: "200px",
        }}
      >
        <p>Game Area - Problems and coding challenges will appear here.</p>
      </div>
    </div>
  );
};
