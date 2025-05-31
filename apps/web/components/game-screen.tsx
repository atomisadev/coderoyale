"use client";

import React, { useState, useEffect } from "react";
import {
  useGameWebSocket,
  PlayerInfo,
  ProblemDetails, // Assuming TestCase is part of ProblemDetails or imported
  TestCase,     // Make sure TestCase is exported and available
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

// Define structure for API communication (matches C# backend)
interface ApiProblemTestCase {
  title: string;
  stdin: string | null; // Allow null if some test cases might not have input
  expectedOutput: string | null; // Allow null
}
interface JudgeApiSubmissionRequest {
  sourceCode: string;
  languageId: number;
  testCases: ApiProblemTestCase[];
}
interface TestCaseExecutionResult {
  title: string;
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  status: string;
  judge0StatusId: number;
  errorMessage?: string;
  time?: string;
  memory?: number;
}
interface CodeSubmissionResult {
  results: TestCaseExecutionResult[];
  overallStatus: string;
  compilationOutput?: string;
  errorOutput?: string;
}


export const GameScreen: React.FC = () => {
  const {
    playersInGame,
    roomCode,
    playerId,
    error: wsError,
    currentProblem,
    // sendMessage, // We might not need sendMessage for code submission if using HTTP API
  } = useGameWebSocket();

  const [code, setCode] = useState<string>(
    "# Write your Python code here\n# Read input using input()\n# Print output using print()\n\nprint('Hello World!')"
  );
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [playersWithHP, setPlayersWithHP] = useState<PlayerWithHP[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  useEffect(() => {
    if (playersInGame.length > 0) {
      const playersHP = playersInGame.map((player) => ({
        ...player,
        hp: 100, // Or fetched from context if HP is managed there
      }));
      setPlayersWithHP(playersHP);
    }
  }, [playersInGame]);

  useEffect(() => {
    // Set initial code if problem provides a template, or on new problem
    if (currentProblem?.title) { // Reset for new problem
        // You might want to add a default template to currentProblem or a specific field for it
        // For now, just resetting to default Python starter.
        setCode("# Write your Python code here\n# Read input using input()\n# Print output using print()\n\nprint('Hello World!')");
        setTerminalOutput([`Problem: ${currentProblem.title} loaded.`,'Ready for submission.']);
        setSubmissionStatus(null);
    }
  }, [currentProblem?.title]);


  if (wsError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 bg-[#0E0E0E]">
        Error: {wsError}
      </div>
    );
  }

  const handleSubmitCode = async () => {
    if (!currentProblem || !playerId || !code.trim()) return;

    setIsSubmitting(true);
    setSubmissionStatus("Submitting to Judge...");
    setTerminalOutput([`> Submitting code for ${currentProblem.title}...`]);

    const validatorTestCases = currentProblem.testCases?.filter(
      (tc) => tc.isValidator && tc.testIn !== undefined && tc.testOut !== undefined // Ensure testIn/Out are not undefined
    ) || [];

    if (validatorTestCases.length === 0) {
      setTerminalOutput((prev) => [...prev, "> No validator test cases found for this problem."]);
      setSubmissionStatus("No validators");
      setIsSubmitting(false);
      return;
    }

    const apiPayload: JudgeApiSubmissionRequest = {
      sourceCode: code,
      languageId: parseInt(process.env.NEXT_PUBLIC_JUDGE0_PYTHON_LANG_ID || "71"), // Default to Python 3.8
      testCases: validatorTestCases.map((tc, index) => ({
        title: tc.title || `Validator ${index + 1}`,
        stdin: tc.testIn,
        expectedOutput: tc.testOut,
      })),
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5217";
      const response = await fetch(`${apiUrl}/api/judge/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      const newTerminalOutput: string[] = [...terminalOutput]; // Start with the "Submitting..." message

      if (!response.ok) {
        const errorData = await response.text();
        newTerminalOutput.push(`> API Error: ${response.status} - ${errorData}`);
        setSubmissionStatus(`API Error: ${response.status}`);
        setTerminalOutput(newTerminalOutput);
        setIsSubmitting(false);
        return;
      }

      const result: CodeSubmissionResult = await response.json();
      newTerminalOutput.push(`> Overall Status: ${result.overallStatus}`);

      if (result.compilationOutput) {
        newTerminalOutput.push(`> Compilation Output:`);
        newTerminalOutput.push(result.compilationOutput);
      }
      if (result.errorOutput && !result.compilationOutput) { // Show general runtime errors if not compilation
        newTerminalOutput.push(`> Execution Error:`);
        newTerminalOutput.push(result.errorOutput);
      }

      result.results.forEach((tcResult) => {
        newTerminalOutput.push("---");
        newTerminalOutput.push(`> Test Case: ${tcResult.title}`);
        newTerminalOutput.push(`> Status: ${tcResult.passed ? "PASSED ✅" : `FAILED ❌ (${tcResult.status})`}`);
        if (!tcResult.passed) {
          newTerminalOutput.push(`> Expected: "${tcResult.expectedOutput}"`);
          newTerminalOutput.push(`> Got: "${tcResult.actualOutput}"`);
          if (tcResult.errorMessage && tcResult.judge0StatusId !== 4) { // Don't show error message if it's just "Wrong Answer"
            newTerminalOutput.push(`> Details: ${tcResult.errorMessage}`);
          }
        }
         if(tcResult.time) newTerminalOutput.push(`> Time: ${tcResult.time}s`);
         if(tcResult.memory) newTerminalOutput.push(`> Memory: ${tcResult.memory} KB`);
      });

      setTerminalOutput(newTerminalOutput);
      setSubmissionStatus(result.overallStatus);
    } catch (error: any) {
      console.error("Error submitting code:", error);
      setTerminalOutput((prev) => [...prev, `> Client-side Error: ${error.message}`]);
      setSubmissionStatus("Client Error");
    } finally {
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

  // Use currentProblem.testCases directly if they include the "isTest" flag as per your JSON
   const getExampleTestCases = () => {
     if (!currentProblem?.testCases) return [];
     // Filter for example tests (isTest: true)
     return currentProblem.testCases.filter((tc) => tc.isTest);
   };

  const playerCards = [
    { id: 1, name: "Attack", cost: 2, description: "Deal 20 damage" },
    { id: 2, name: "Shield", cost: 1, description: "Block attack" },
    // ... other cards
  ];

  return (
    <div className="h-screen w-screen bg-[#0E0E0E] text-white p-4">
      <div className="grid grid-cols-4 grid-rows-4 gap-4 h-full">
        {/* Problem and Test Cases Card */}
        <Card className="col-span-2 row-span-2 border-gray-700 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg p-2">
              {currentProblem?.title || "Loading Problem..."}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto"> {/* Use overflow-auto here */}
            <ScrollArea className="h-full pr-2"> {/* ScrollArea now direct child */}
              {currentProblem ? (
                <div className="space-y-6 ">
                  <div>
                    <h4 className="font-medium mb-3 text-orange-400">Problem Statement:</h4>
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
                       <h4 className="font-medium mb-3 text-green-400">Output:</h4>
                       <p className="whitespace-pre-wrap text-gray-300 text-sm break-words">
                         {currentProblem.outputDescription}
                       </p>
                     </div>
                  )}
                  {currentProblem.constraints && currentProblem.constraints.trim() !== "" && (
                    <div>
                      <h4 className="font-medium mb-3 text-purple-400">Constraints:</h4>
                      <p className="whitespace-pre-wrap text-gray-300 text-sm break-words">
                        {currentProblem.constraints}
                      </p>
                    </div>
                  )}
                  {getExampleTestCases().length > 0 && (
                    <div>
                      <h4 className="font-medium mb-4 text-cyan-400">Examples:</h4>
                      <div className="space-y-4">
                        {getExampleTestCases().map((testCase, index) => (
                          <div key={index} className="space-y-3">
                            <div className="font-medium text-white">Example {index + 1}:</div>
                            <div>
                              <div className="text-sm font-medium text-gray-400 mb-1">Input:</div>
                              <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
                                <code className="text-sm text-gray-200 font-mono whitespace-pre-wrap break-words">
                                  {testCase.testIn}
                                </code>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-400 mb-1">Output:</div>
                              <div className="bg-gray-800/60 border border-gray-600 rounded-md p-3">
                                <code className="text-sm text-gray-200 font-mono whitespace-pre-wrap break-words">
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
                <p className="text-center text-gray-400">Loading problem or problem not available...</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Code Editor and Terminal Card */}
        <Card className="col-span-2 row-span-2 border-gray-700 overflow-hidden flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Development Environment</CardTitle>
              <div className="flex gap-3 items-center">
                {submissionStatus && submissionStatus !== "Submitting to Judge..." && (
                  <Badge
                    variant={
                      submissionStatus === "All tests passed!" ? "default"
                      : submissionStatus.includes("Error") || submissionStatus.includes("failed") || submissionStatus.includes("No validators") ? "destructive"
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
                      fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false,
                      automaticLayout: true, tabSize: 4, insertSpaces: true, wordWrap: "on",
                      lineNumbers: "on", padding: { top: 16, bottom: 16 },
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="terminal" className="flex-1 overflow-hidden">
                <div className="h-full border border-gray-600 rounded-lg bg-black p-4 overflow-auto"> {/* Use overflow-auto */}
                  <ScrollArea className="h-full"> {/* ScrollArea direct child */}
                    <div className="font-mono text-sm space-y-1 whitespace-pre-wrap break-words">
                      {terminalOutput.length === 0 ? (
                        <p className="text-gray-400">Terminal output will appear here...</p>
                      ) : (
                        terminalOutput.map((line, index) => (
                          <div
                            key={index}
                            className={`${
                              line.includes("PASSED ✅") ? "text-green-400"
                              : line.includes("FAILED ❌") || line.toLowerCase().includes("error") ? "text-red-400"
                              : line.startsWith(">") ? "text-blue-400"
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

        {/* Players Card - ensure it's flex-col and CardContent is overflow-auto */}
        <Card className="col-span-2 row-span-2 border-gray-700 overflow-hidden flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg">Players ({playersWithHP.length}/10)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                <ScrollArea className="h-full pr-2">
                    <div className="space-y-3">
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
                                    <span className="text-xs text-gray-400">{player.hp} HP</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    Rank #{Math.floor(Math.random() * 10) + 1}
                                </Badge>
                                </div>
                            </div>
                        ))}
                        {Array.from({ length: Math.max(0, 10 - playersWithHP.length) }).map((_, index) => (
                            <div key={`empty-${index}`} className="p-3 border border-dashed border-gray-600 rounded-lg opacity-50">
                                <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <span className="text-gray-500">Empty Slot</span>
                                    <div className="flex items-center gap-2">
                                    <HPBar hp={0} />
                                    <span className="text-xs text-gray-500">0 HP</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-xs opacity-50">Waiting...</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>


        {/* Hand of Cards */}
        <div className="col-span-2 row-span-2 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Your Hand</h3>
          </div>
          <div className="flex-1 flex items-end justify-center p-8 overflow-auto"> {/* Added overflow-auto here too for safety */}
            <div className="relative flex items-end justify-center">
              {playerCards.map((card, index) => (
                <div
                  key={card.id}
                  className="relative group cursor-pointer transition-all duration-300 ease-out"
                  style={{
                    transform: `
                      translateX(${(index - (playerCards.length -1)/2) * 50}px) 
                      rotate(${(index - (playerCards.length -1)/2) * 8}deg)
                      translateY(${Math.abs(index - (playerCards.length -1)/2) * 12}px)
                    `,
                    zIndex: index + 1,
                  }}
                >
                  <div
                    className="w-32 h-48 border-2 border-gray-600 rounded-lg p-3 shadow-lg transition-all duration-300 group-hover:border-blue-500 group-hover:shadow-blue-500/20 group-hover:scale-110 group-hover:-translate-y-8 group-hover:rotate-0 group-hover:z-50 backdrop-blur-sm bg-gray-800/70" // Added bg
                    style={{ transformOrigin: "bottom center" }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-white leading-tight">{card.name}</h4>
                      <div className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                        {card.cost}⚡
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center mb-2">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">
                          {card.name === "Attack" ? "⚔️" : card.name === "Shield" ? "🛡️" : card.name === "Heal" ? "❤️" : card.name === "Boost" ? "⚡" : "🔧"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 text-center leading-tight">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed top-4 right-4">
        <Badge variant="outline" className="bg-gray-900/80 border-gray-600">
          Room: {roomCode}
        </Badge>
      </div>
    </div>
  );
};