"use client";

import React, { useState, useEffect } from "react";
import { useGameWebSocket, PlayerInfo } from "../context/game-socket-provider";
import { Button } from "@/components/ui/button";

export const Lobby: React.FC = () => {
  const {
    roomCode,
    playersInLobby,
    playerName,
    playerId,
    hostPlayerId,
    sendMessage,
    isGameStarted,
  } = useGameWebSocket();
  const [shareableLink, setShareableLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (roomCode && typeof window !== "undefined") {
      setShareableLink(`${window.location.origin}/?roomCode=${roomCode}`);
    }
  }, [roomCode]);

  if (isGameStarted) {
    return null;
  }

  if (!roomCode) {
    return <div>Error: Not in a room.</div>;
  }

  const handleCopyLink = async () => {
    if (navigator.clipboard && shareableLink) {
      try {
        await navigator.clipboard.writeText(shareableLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to copy link: ", err);
        alert("Failed to copy link. Please copy it manually.");
      }
    } else {
      alert("Clipboard API not available. Please copy the link manually.");
    }
  };

  const handleStartGame = () => {
    sendMessage("startGame", {});
  };

  const isHost = playerId === hostPlayerId;

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "500px",
        margin: "20px auto",
        textAlign: "center",
      }}
      className="bg-[#1B1B1Baa] border boder-1px border-[#3D3D3D] text-white text-center mt-20"
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

      {shareableLink && (
        <div style={{ marginTop: "15px", marginBottom: "15px" }} className="flex-col flex ">
          <p>Share this link to invite others:</p>
          <input
            type="text"
            value={shareableLink}
            readOnly
            className="placeholder-[#FFFFFFaa] p-2 m-2 bg-none text-center rounded-sm"
            onFocus={(e) => e.target.select()}
          />
          <Button onClick={handleCopyLink} size="sm" className="text-black bg-white mx-4">
            {linkCopied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      )}

      <h3 style={{ marginTop: "20px" }}>
        Players in Lobby ({playersInLobby.length}/10):
      </h3>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {playersInLobby.map((player: PlayerInfo) => (
          <li
            key={player.id}
            style={{
              padding: "5px 0",
              borderBottom: "1px dashed #eee",
              textAlign: "left",
              paddingLeft: "20px",
            }}
          >
            {player.name} {player.id === playerId ? "(You)" : ""}
          </li>
        ))}
      </ul>

      {isHost && playersInLobby.length >= 1 && (
        <Button
          onClick={handleStartGame}
          style={{ marginTop: "20px" }}
          disabled={isGameStarted}
          className="bg-[#FFFFFF] text-[#000] m-2"
        >
          Start Game
        </Button>
      )}
    </div>
  );
};
