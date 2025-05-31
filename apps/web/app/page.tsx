// apps/web/app/page.tsx
"use client";

import React, { Suspense } from "react"; // Import Suspense
import styles from "./page.module.css";
import { useGameWebSocket } from "../context/game-socket-provider";
import { CreateJoinRoom } from "../components/create-join-room";
import { Lobby } from "../components/lobby";
import { useSearchParams } from "next/navigation";

function HomePageContent() {
  const { isConnected, roomCode, error: wsError } = useGameWebSocket();
  const searchParams = useSearchParams();
  const roomCodeFromUrl = searchParams.get("roomCode");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Code Royale</h1>
        {!isConnected && (
          <p style={{ color: "orange" }}>Connecting to server...</p>
        )}
        {wsError && <p style={{ color: "red" }}>Connection Error: {wsError}</p>}

        {isConnected && !roomCode && (
          <CreateJoinRoom initialRoomCode={roomCodeFromUrl || undefined} />
        )}

        {isConnected && roomCode && <Lobby />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    // Wrap the component that uses useSearchParams with Suspense
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
