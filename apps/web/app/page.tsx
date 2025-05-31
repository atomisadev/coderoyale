"use client";

import styles from "./page.module.css";
import { useGameWebSocket } from "../context/game-socket-provider";
import { CreateJoinRoom } from "../components/create-join-room";
import { Lobby } from "../components/lobby";

export default function Home() {
  const { isConnected, roomCode, error: wsError } = useGameWebSocket();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Code Royale</h1>
        {!isConnected && (
          <p style={{ color: "orange" }}>Connecting to server...</p>
        )}
        {wsError && <p style={{ color: "red" }}>Connection Error: {wsError}</p>}

        {isConnected && !roomCode && <CreateJoinRoom />}

        {isConnected && roomCode && <Lobby />}
      </main>
    </div>
  );
}
