"use client";

import React from "react";
import { useGameWebSocket } from "@/context/game-socket-provider";

interface DefendCardProps {
  style?: React.CSSProperties;
  className?: string;
  onActivate: () => void; // Callback when card is activated/used
}

export const DefendCard: React.FC<DefendCardProps> = ({
  style,
  className,
  onActivate,
}) => {
  const { sendMessage, playerId } = useGameWebSocket();

  const handleDefend = () => {
    console.log("Using Defend card");
    sendMessage("applyDefendCard", { healAmount: 10 }); // playerId is implicitly known by backend
    onActivate(); // Notify parent that card was used
  };

  return (
    <div
      style={style}
      className={`${className} bg-blue-700 border-blue-900 hover:bg-blue-600 flex items-center justify-center text-white font-bold text-2xl p-4 rounded-lg shadow-lg cursor-pointer`}
      onClick={handleDefend}
    >
      Defend
    </div>
  );
};
