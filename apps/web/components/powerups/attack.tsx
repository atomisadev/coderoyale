"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"; // Adjust if your Dialog path is different
import { Button } from "@/components/ui/button";
import { useGameWebSocket, PlayerInfo } from "@/context/game-socket-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AttackCardProps {
  style?: React.CSSProperties;
  className?: string;
  onActivate: () => void; // Callback when card is activated/used
}

// Re-define HPBar or import if it's made common
const HPBar: React.FC<{ hp: number }> = ({ hp }) => (
  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden my-1">
    <div
      className={`h-full transition-all duration-300 ${
        hp > 60 ? "bg-green-500" : hp > 30 ? "bg-orange-500" : "bg-red-500"
      }`}
      style={{ width: `${Math.max(0, Math.min(hp, 100))}%` }}
    />
  </div>
);

export const AttackCard: React.FC<AttackCardProps> = ({
  style,
  className,
  onActivate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { playersInGame, playerId, sendMessage } = useGameWebSocket();

  const otherPlayers = playersInGame.filter((p) => p.id !== playerId);

  const handleAttack = (targetPlayerId: string) => {
    console.log(`Attacking player ${targetPlayerId}`);
    sendMessage("applyAttackCard", { targetPlayerId, damage: 10 });
    setIsModalOpen(false);
    onActivate(); // Notify parent that card was used
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <div
          style={style}
          className={`${className} bg-red-700 border-red-900 hover:bg-red-600 flex items-center justify-center text-white font-bold text-2xl p-4 rounded-lg shadow-lg cursor-pointer`}
          onClick={() => setIsModalOpen(true)}
        >
          Attack
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Select Player to Attack</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full pr-4">
          <div className="space-y-3 py-4">
            {otherPlayers.length > 0 ? (
              otherPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-md"
                >
                  <div className="flex-grow mr-4">
                    <span className="font-medium">{player.name}</span>
                    <HPBar hp={player.hp || 100} />
                    <span className="text-xs text-gray-400">
                      {player.hp || 100} HP
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAttack(player.id)}
                  >
                    Attack
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400">
                No other players to attack.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
