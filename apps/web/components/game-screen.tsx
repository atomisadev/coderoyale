"use client";

import React, { useState, useEffect } from "react";
import {
  useGameWebSocket,
  PlayerInfo,
  ProblemDetails,
  TestCase,
} from "@/context/game-socket-provider";
import Editor from "@monaco-editor/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlayerWithHP extends PlayerInfo {
  hp: number;
}

export const GameScreen: React.FC = () => {
  const {
    playersInGame,
    roomCode,
    playerId,
    error: wsError,
    currentProblem,
    sendMessage,
  } = useGameWebSocket();

  const [code, setCode] = useState<string>(
    "# Write your Python code here\n# Read input using input() function\n# Print output using print() function\n\nprint('Hello World!')"
  );
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [playersWithHP, setPlayersWithHP] = useState<PlayerWithHP[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  useEffect(() => {
    if (playersInGame.length > 0) {
      const playersHP = playersInGame.map((player) => ({
        ...player,
        hp: 100,
      }));
      setPlayersWithHP(playersHP);
    }
  }, [playersInGame]);

  if (wsError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 bg-[#0E0E0E]">
        Error: {wsError}
      </div>
    );
  }

  const handleSubmitCode = async () => {
    if (!currentProblem || !playerId) return;

    setIsSubmitting(true);
    setSubmissionStatus("Running tests...");

    // Add terminal output for running tests
    const newOutput = [
      ...terminalOutput,
      `> Running tests for ${currentProblem.title}...`,
      `> Executing code...`,
    ];
    setTerminalOutput(newOutput);

    try {
      // Simulate test running
      setTimeout(() => {
        const finalOutput = [
          ...newOutput,
          `> Test 1: PASSED`,
          `> Test 2: PASSED`,
          `> Test 3: PASSED`,
          `> All tests passed! ✅`,
          `> Score: 100 points`,
          ``,
        ];
        setTerminalOutput(finalOutput);
        setSubmissionStatus("All tests passed!");
        setIsSubmitting(false);
      }, 2000);
    } catch (error) {
      console.error("Error running tests:", error);
      const errorOutput = [
        ...newOutput,
        `> Error: ${error}`,
        `> Submission failed ❌`,
        ``,
      ];
      setTerminalOutput(errorOutput);
      setSubmissionStatus("Error running tests");
      setIsSubmitting(false);
    }
  };

  const HPBar: React.FC<{ hp: number }> = ({ hp }) => (
    <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${
          hp > 60 ? "bg-green-500" : hp > 30 ? "bg-orange-500" : "bg-red-500"
        }`}
        style={{ width: `${hp}%` }}
      />
    </div>
  );

  const getExampleTestCases = () => {
    if (!currentProblem?.testCases) return [];
    return currentProblem.testCases.filter((tc) => tc.isTest);
  };

  // Mock cards data - replace with actual card system
  const playerCards = [
    { id: 1, name: "Attack", cost: 2, description: "Deal 20 damage" },
    { id: 2, name: "Shield", cost: 1, description: "Block attack" },
    { id: 3, name: "Heal", cost: 3, description: "Restore 30 HP" },
    { id: 4, name: "Boost", cost: 2, description: "Double score" },
    { id: 5, name: "Sabotage", cost: 4, description: "Slow enemy" },
  ];

  return (
    <div className="h-screen w-screen bg-[#0E0E0E] text-white p-4">
      <div className="grid grid-cols-4 grid-rows-4 gap-4 h-full">
        {/* Top Left - Problem and Test Cases (spans 2 cols, 2 rows) */}
        <Card className="col-span-2 row-span-2 border-gray-700 overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg p-2">
              {currentProblem?.title || "Loading Problem..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {currentProblem ? (
                <div className="space-y-6 pr-4">
                  <div>
                    <h4 className="font-medium mb-3 text-orange-400">
                      Problem Statement:
                    </h4>
                    <p className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed break-words">
                      {currentProblem.statement}
                    </p>
                  </div>

                  {currentProblem.inputDescription && (
                    <div>
                      <h4 className="font-medium mb-3 text-blue-400">Input:</h4>
                      <p className="whitespace-pre-wrap text-gray-300 text-sm break-words">
                        {currentProblem.inputDescription}
                      </p>
                    </div>
                  )}

                  {currentProblem.outputDescription && (
                    <div>
                      <h4 className="font-medium mb-3 text-green-400">
                        Output:
                      </h4>
                      <p className="whitespace-pre-wrap text-gray-300 text-sm break-words">
                        {currentProblem.outputDescription}
                      </p>
                    </div>
                  )}

                  {currentProblem.constraints &&
                    currentProblem.constraints.trim() !== "" && (
                      <div>
                        <h4 className="font-medium mb-3 text-purple-400">
                          Constraints:
                        </h4>
                        <p className="whitespace-pre-wrap text-gray-300 text-sm break-words">
                          {currentProblem.constraints}
                        </p>
                      </div>
                    )}

                  {/* Example Test Cases - LeetCode Style */}
                  {getExampleTestCases().length > 0 && (
                    <div>
                      <h4 className="font-medium mb-4 text-cyan-400">
                        Examples:
                      </h4>
                      <div className="space-y-4">
                        {getExampleTestCases().map((testCase, index) => (
                          <div key={index} className="space-y-3">
                            <div className="font-medium text-white">
                              Example {index + 1}:
                            </div>

                            <div>
                              <div className="text-sm font-medium text-gray-400 mb-1">
                                Input:
                              </div>
                              <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
                                <code className="text-sm text-gray-200 font-mono">
                                  {testCase.testIn}
                                </code>
                              </div>
                            </div>

                            <div>
                              <div className="text-sm font-medium text-gray-400 mb-1">
                                Output:
                              </div>
                              <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
                                <code className="text-sm text-gray-200 font-mono">
                                  {testCase.testOut}
                                </code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-400">
                  Loading problem or problem not available...
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Right - Code Editor and Terminal with Tabs (spans 2 cols, 2 rows) */}
        <Card className="col-span-2 row-span-2 border-gray-700 overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Development Environment</CardTitle>
              <div className="flex gap-3 items-center">
                {submissionStatus &&
                  submissionStatus !== "Running tests..." && (
                    <Badge
                      variant={
                        submissionStatus === "All tests passed!"
                          ? "default"
                          : submissionStatus.includes("Error") ||
                              submissionStatus.includes("failed")
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {submissionStatus}
                    </Badge>
                  )}
                <Button
                  onClick={handleSubmitCode}
                  disabled={!currentProblem || !code.trim() || isSubmitting}
                  className="px-4 py-2"
                >
                  {isSubmitting ? "Running Tests..." : "Submit Code"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <Tabs defaultValue="editor" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="editor">Code Editor</TabsTrigger>
                <TabsTrigger value="terminal">Terminal</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="flex-1 overflow-hidden">
                <div className="h-full border border-gray-600 rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      insertSpaces: true,
                      wordWrap: "on",
                      lineNumbers: "on",
                      padding: { top: 16, bottom: 16 },
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="terminal" className="flex-1 overflow-hidden">
                <div className="h-full border border-gray-600 rounded-lg bg-black p-4 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="font-mono text-sm space-y-1">
                      {terminalOutput.length === 0 ? (
                        <p className="text-gray-400">
                          Terminal output will appear here when you run tests...
                        </p>
                      ) : (
                        terminalOutput.map((line, index) => (
                          <div
                            key={index}
                            className={`${
                              line.includes("PASSED") || line.includes("✅")
                                ? "text-green-400"
                                : line.includes("Error") || line.includes("❌")
                                  ? "text-red-400"
                                  : line.startsWith(">")
                                    ? "text-blue-400"
                                    : "text-gray-300"
                            }`}
                          >
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Bottom Left - Players (spans 2 cols, 2 rows) */}
        <Card className="col-span-2 row-span-2 border-gray-700 overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg">
              Players ({playersWithHP.length}/10)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4">
                {playersWithHP.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      player.id === playerId
                        ? "bg-blue-900/30 border-blue-600"
                        : "bg-gray-800/30 border-gray-600"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {player.name} {player.id === playerId ? "(You)" : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          <HPBar hp={player.hp} />
                          <span className="text-xs text-gray-400">
                            {player.hp} HP
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Rank #{Math.floor(Math.random() * 10) + 1}
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* Fill remaining slots */}
                {Array.from({
                  length: Math.max(0, 10 - playersWithHP.length),
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="p-3 border border-dashed border-gray-600 rounded-lg opacity-50"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-500">Empty Slot</span>
                        <div className="flex items-center gap-2">
                          <HPBar hp={0} />
                          <span className="text-xs text-gray-500">0 HP</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs opacity-50">
                        Waiting...
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Bottom Right - Hand of Cards (spans 2 cols, 2 rows) */}
        <div className="col-span-2 row-span-2 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Your Hand</h3>
          </div>
          <div className="flex-1 flex items-end justify-center p-8">
            <div className="relative flex items-end justify-center">
              {playerCards.map((card, index) => (
                <div
                  key={card.id}
                  className="relative group cursor-pointer transition-all duration-300 ease-out"
                  style={{
                    transform: `
                      translateX(${(index - 2) * 50}px) 
                      rotate(${(index - 2) * 8}deg)
                      translateY(${Math.abs(index - 2) * 12}px)
                    `,
                    zIndex: index + 1,
                  }}
                >
                  {/* Card - Removed background */}
                  <div
                    className="w-32 h-48 border-2 border-gray-600 rounded-lg p-3 shadow-lg transition-all duration-300 group-hover:border-blue-500 group-hover:shadow-blue-500/20 group-hover:scale-110 group-hover:-translate-y-8 group-hover:rotate-0 group-hover:z-50 backdrop-blur-sm"
                    style={{
                      transformOrigin: "bottom center",
                    }}
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {card.name}
                      </h4>
                      <div className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                        {card.cost}⚡
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex-1 flex items-center justify-center mb-2">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">
                          {card.name === "Attack"
                            ? "⚔️"
                            : card.name === "Shield"
                              ? "🛡️"
                              : card.name === "Heal"
                                ? "❤️"
                                : card.name === "Boost"
                                  ? "⚡"
                                  : "🔧"}
                        </span>
                      </div>
                    </div>

                    {/* Card Description */}
                    <p className="text-xs text-gray-300 text-center leading-tight">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Room Code Indicator */}
      <div className="fixed top-4 right-4">
        <Badge variant="outline" className="bg-gray-900/80 border-gray-600">
          Room: {roomCode}
        </Badge>
      </div>
    </div>
  );
};
