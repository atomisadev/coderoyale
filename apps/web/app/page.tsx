"use client";

import React, { Suspense } from "react";
import { useGameWebSocket } from "../context/game-socket-provider";
import { CreateJoinRoom } from "../components/create-join-room";
import { Lobby } from "../components/lobby";
import { GameScreen } from "../components/game-screen";
import { useSearchParams } from "next/navigation";

function HomePageContent() {
  const {
    isConnected,
    roomCode,
    error: wsError,
    isGameStarted,
  } = useGameWebSocket();
  const searchParams = useSearchParams();
  const roomCodeFromUrl = searchParams.get("roomCode");

  return (
    <div>
      <main className="">
        {!isConnected && (
          <p style={{ color: "orange" }}>Connecting to server...</p>
        )}
        {wsError && <p style={{ color: "red" }}>Connection Error: {wsError}</p>}

        {isConnected && !roomCode && (
          <CreateJoinRoom initialRoomCode={roomCodeFromUrl || undefined} />
        )}

        {isConnected && roomCode && !isGameStarted && <Lobby />}

        {isConnected && roomCode && isGameStarted && <GameScreen />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
