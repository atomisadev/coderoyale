// apps/web/components/power-up-card.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PowerUpCardProps {
  type: "attack" | "defend";
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const PowerUpCard: React.FC<PowerUpCardProps> = ({
  type,
  onClick,
  className,
  style,
}) => {
  const isAttack = type === "attack";

  return (
    <div
      className={cn(
        "w-32 h-48 border-2 rounded-lg p-3 shadow-lg transition-all duration-300 cursor-pointer",
        "hover:border-blue-500 hover:shadow-blue-500/20 hover:scale-110 hover:-translate-y-8 hover:rotate-0 hover:z-50",
        "backdrop-blur-sm flex flex-col justify-center items-center",
        isAttack
          ? "bg-red-800/70 border-red-600 hover:bg-red-700/80"
          : "bg-green-800/70 border-green-600 hover:bg-green-700/80",
        className
      )}
      style={{ transformOrigin: "bottom center", ...style }}
      onClick={onClick}
    >
      <div className="text-center">
        <div className="text-2xl mb-2">{isAttack ? "⚔️" : "🛡️"}</div>
        <h3 className="text-lg font-bold text-white mb-2">
          {isAttack ? "Attack" : "Defend"}
        </h3>
        <p className="text-xs text-gray-200 text-center">
          {isAttack ? "Deal 10 damage" : "Heal 10 HP"}
        </p>
      </div>
    </div>
  );
};
