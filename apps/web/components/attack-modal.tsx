// apps/web/components/attack-modal.tsx
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayerInfo } from "@/context/game-socket-provider";

interface AttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerInfo[];
  currentPlayerId: string;
  onAttack: (targetPlayerId: string) => void;
}

const HPBar: React.FC<{ hp: number }> = ({ hp }) => (
  <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
    <div
      className={`h-full transition-all duration-300 ${
        hp > 60 ? "bg-green-500" : hp > 30 ? "bg-orange-500" : "bg-red-500"
      }`}
      style={{ width: `${Math.max(0, Math.min(100, hp))}%` }}
    />
  </div>
);

export const AttackModal: React.FC<AttackModalProps> = ({
  isOpen,
  onClose,
  players,
  currentPlayerId,
  onAttack,
}) => {
  const targetablePlayers = players.filter(
    (player) => player.id !== currentPlayerId && (player.hp || 100) > 0
  );

  const handleAttack = (targetPlayerId: string) => {
    console.log("Attack button clicked for player:", targetPlayerId);
    try {
      onAttack(targetPlayerId);
      onClose();
    } catch (error) {
      console.error("Error in handleAttack:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Choose Target to Attack
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {targetablePlayers.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No players available to attack
            </p>
          ) : (
            targetablePlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-600"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-white">{player.name}</span>
                  <HPBar hp={player.hp || 100} />
                </div>
                <Button
                  onClick={() => handleAttack(player.id)}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Attack
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
