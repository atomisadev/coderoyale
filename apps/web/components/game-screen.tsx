"use client";

import React from "react";
import { useGameWebSocket, PlayerInfo } from "@/context/game-socket-provider";
// import { Button } from "./ui/button";

export const GameScreen: React.FC = () => {
  const {
    playersInGame,
    roomCode,
    playerId,
    playerName,
    error: wsError,
    currentProblem,
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
          marginTop: "20px",
          padding: "20px",
          border: "1px dashed #666",
          minHeight: "300px", // Increased height for problem
          textAlign: "left", // Align problem text to the left
          backgroundColor: "rgba(255,255,255,0.05)", // Slightly different background for problem area
          borderRadius: "4px",
        }}
      >
        {currentProblem ? (
          <>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "15px",
                textAlign: "center",
              }}
            >
              {currentProblem.title}
            </h3>

            <h4>Problem Statement:</h4>
            <p style={{ whiteSpace: "pre-wrap", marginBottom: "15px" }}>
              {currentProblem.statement}
            </p>

            {currentProblem.inputDescription && (
              <>
                <hr style={{ margin: "10px 0", borderColor: "#555" }} />
                <h4>Input Description:</h4>
                <p style={{ whiteSpace: "pre-wrap", marginBottom: "15px" }}>
                  {currentProblem.inputDescription}
                </p>
              </>
            )}

            {currentProblem.outputDescription && (
              <>
                <hr style={{ margin: "10px 0", borderColor: "#555" }} />
                <h4>Output Description:</h4>
                <p style={{ whiteSpace: "pre-wrap", marginBottom: "15px" }}>
                  {currentProblem.outputDescription}
                </p>
              </>
            )}

            {currentProblem.constraints &&
              currentProblem.constraints.trim() !== "" && (
                <>
                  <hr style={{ margin: "10px 0", borderColor: "#555" }} />
                  <h4>Constraints:</h4>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {currentProblem.constraints}
                  </p>
                </>
              )}
          </>
        ) : (
          <p style={{ textAlign: "center" }}>
            Loading problem or problem not available...
          </p>
        )}
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
