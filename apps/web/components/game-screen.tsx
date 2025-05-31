"use client";

import React, { useState, useEffect } from "react";
import {
  useGameWebSocket,
  PlayerInfo,
  ProblemDetails,
} from "@/context/game-socket-provider";
import Editor from "@monaco-editor/react";
import { resourceLimits } from "worker_threads";

interface PlayerWithHP extends PlayerInfo {
  hp: number;
}

export const GameScreen: React.FC = () => {
  const {
    playersInGame,
    roomCode,
    playerId,
    playerName,
    error: wsError,
    currentProblem,
    sendMessage,
  } = useGameWebSocket();

  const [code, setCode] = useState<string>("// Write your code here");
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [playersWithHP, setPlayersWithHP] = useState<PlayerWithHP[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string>("");

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
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        Error: {wsError}
      </div>
    );
  }

  const handleSubmitCode = async () => {
    if (!currentProblem || !playerId) return;

    setSubmissionStatus("Submitting...");
    setSubmissionResult(null);
    setTerminalOutput("Submitting code...");

    try {
      const submissionPayload = {
        source_code: code,
        language_id: 71,
        stdin: "",
        expected_output: "",
      };

      const submissionResponse = await fetch(
        "http://20.84.52.40:2358/submissions/?base64_encoded=false&wait=false",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionPayload),
        }
      );

      if (!submissionResponse.ok) {
        const errorText = await submissionResponse.text();
        throw new Error(`HTTP ${submissionResponse.status}: ${errorText}`);
      }

      const submissionData = await submissionResponse.json();
      const token = submissionData.token;

      setTerminalOutput(
        (prev) => prev + `Submission created with token: ${token}\n`
      );

      let attempts = 0;
      const maxAttempts = 10;

      const pollResult = async () => {
        if (attempts >= maxAttempts) {
          setSubmissionStatus("Submission timeout");
          setTerminalOutput((prev) => prev + "Timeout waiting for result\n");
          return;
        }

        try {
          const resultResponse = await fetch(
            `http://20.84.52.40:2358/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,status,status_id,time,memory`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!resultResponse.ok) {
            throw new Error("Failed to get result");
          }

          const result = await resultResponse.json();
          setTerminalOutput(
            (prev) =>
              prev +
              `Poll attempt ${attempts + 1}: Status ID ${result.status?.id}\n`
          );

          if (result.status?.id <= 2) {
            attempts++;
            setTimeout(pollResult, 1000);
          } else {
            setSubmissionResult(result);

            if (result.stdout) {
              setTerminalOutput((prev) => prev + result.stdout);
            } else if (result.stderr) {
              setTerminalOutput((prev) => prev + `Error: ${result.stderr}`);
            } else if (result.compile_output) {
              setTerminalOutput(
                (prev) => prev + `Compile Error: ${result.compile_output}\n`
              );
            }

            if (result.status?.id === 3) {
              setSubmissionStatus("Accepted");
              sendMessage("submitCode", {
                playerId,
                problemId: currentProblem.title,
                languageId: 71,
                sourceCode: code,
                result: "accepted",
              });
            } else {
              setSubmissionResult("Failed");
            }
          }
        } catch (error) {
          console.error("Error polling result:", error);
          setSubmissionStatus("Error getting result");
          setTerminalOutput((prev) => prev + `Error: ${error}\n`);
        }
      };

      setTimeout(pollResult, 1000);
    } catch (error) {
      console.error("Error submitting code:", error);
      setSubmissionStatus("Submission failed");
      setTerminalOutput((prev) => prev + `Submission failed: ${error}\n`);
    }
  };

  const HPBar: React.FC<{ hp: number }> = ({ hp }) => (
    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${hp > 60 ? "bg-green-500" : hp > 30 ? "bg-orange-500" : "bg-red-500"}`}
        style={{ width: `${hp}%` }}
      ></div>
    </div>
  );

  const editorHeight = "calc(100vh - 40px)";

  return (
    <div className="h-screen w-screen grid grid-cols-2 gap-2 p-2 bg-gray-900 text-white overflow-hidden">
      {/* Left Side - Split between Problem and Players */}
      <div className="grid grid-rows-2 gap-2 h-full">
        {/* Top Left - Problem */}
        <div className="p-4 border border-gray-600 rounded-lg bg-gray-800/50 overflow-y-auto">
          <h3 className="text-lg font-semibold text-center mb-4">
            {currentProblem?.title || "Loading Problem..."}
          </h3>

          {currentProblem ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Problem Statement:</h4>
                <p className="whitespace-pre-wrap text-gray-300">
                  {currentProblem.statement}
                </p>
              </div>

              {currentProblem.inputDescription && (
                <div>
                  <hr className="border-gray-600 my-3" />
                  <h4 className="font-medium mb-2">Input Description:</h4>
                  <p className="whitespace-pre-wrap text-gray-300">
                    {currentProblem.inputDescription}
                  </p>
                </div>
              )}

              {currentProblem.outputDescription && (
                <div>
                  <hr className="border-gray-600 my-3" />
                  <h4 className="font-medium mb-2">Output Description:</h4>
                  <p className="whitespace-pre-wrap text-gray-300">
                    {currentProblem.outputDescription}
                  </p>
                </div>
              )}

              {currentProblem.constraints &&
                currentProblem.constraints.trim() !== "" && (
                  <div>
                    <hr className="border-gray-600 my-3" />
                    <h4 className="font-medium mb-2">Constraints:</h4>
                    <p className="whitespace-pre-wrap text-gray-300">
                      {currentProblem.constraints}
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <p className="text-center text-gray-400">
              Loading problem or problem not available...
            </p>
          )}
        </div>

        {/* Bottom Left - Players with HP */}
        <div className="p-4 border border-gray-600 rounded-lg bg-gray-800/50 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            Players ({playersWithHP.length}/10)
          </h3>
          <div className="space-y-2">
            {playersWithHP.map((player) => (
              <div
                key={player.id}
                className={`p-3 border rounded-md flex justify-between items-center ${
                  player.id === playerId
                    ? "bg-blue-900/30 border-blue-600"
                    : "bg-gray-700/20 border-gray-600"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm">
                    {player.name} {player.id === playerId ? "(You)" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <HPBar hp={player.hp} />
                    <span className="text-xs text-gray-400">
                      {player.hp} HP
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Fill remaining slots with empty players */}
            {Array.from({ length: 10 - playersWithHP.length }).map(
              (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="p-3 border border-dashed border-gray-600 rounded-md flex justify-between items-center opacity-50 bg-gray-800/10"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">Empty Slot</span>
                    <div className="flex items-center gap-2">
                      <HPBar hp={0} />
                      <span className="text-xs text-gray-400">0 HP</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Code Editor and Terminal */}
      <div className="flex flex-col gap-2 h-full">
        {/* Editor Header */}
        <div className="px-4 py-2 border border-gray-600 rounded-t-lg bg-gray-800/50 flex justify-between items-center min-h-[3rem]">
          <h3 className="text-base font-medium">Room: {roomCode}</h3>
          <div className="flex gap-2 items-center">
            {submissionStatus && (
              <span
                className={`px-2 py-1 rounded text-xs ${
                  submissionStatus === "Accepted"
                    ? "bg-green-600"
                    : submissionStatus === "Failed"
                      ? "bg-red-600"
                      : "bg-orange-600"
                }`}
              >
                {submissionStatus}
              </span>
            )}
            <button
              onClick={handleSubmitCode}
              disabled={
                !currentProblem ||
                !code.trim() ||
                submissionStatus === "Submitting..."
              }
              className="px-3 py-1 bg-blue-600 text-white border-none rounded cursor-pointer text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submissionStatus === "Submitting..."
                ? "Submitting..."
                : "Submit Code"}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 border border-gray-600 rounded-none overflow-hidden min-h-0">
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
              folding: true,
              cursorBlinking: "blink",
              cursorStyle: "line",
            }}
          />
        </div>

        {/* Terminal Output */}
        <div className="h-48 border border-gray-600 rounded-b-lg bg-black/80 overflow-hidden">
          <div className="px-3 py-1 bg-gray-700 text-xs font-medium border-b border-gray-600">
            Console Output
          </div>
          <div className="h-full p-3 overflow-y-auto font-mono text-xs text-green-400">
            <pre className="whitespace-pre-wrap">
              {terminalOutput || "Ready for code submission..."}
            </pre>
            {submissionResult && (
              <div className="mt-2 space-y-2">
                <div className="text-yellow-400">
                  Status: {submissionResult.status?.description}
                </div>
                {submissionResult.stdout && (
                  <div>
                    <div className="text-blue-400">Output:</div>
                    <pre className="bg-gray-900 p-2 rounded text-white">
                      {submissionResult.stdout}
                    </pre>
                  </div>
                )}
                {submissionResult.stderr && (
                  <div>
                    <div className="text-red-400">Error:</div>
                    <pre className="bg-red-900/20 p-2 rounded text-red-300">
                      {submissionResult.stderr}
                    </pre>
                  </div>
                )}
                {submissionResult.compile_output && (
                  <div>
                    <div className="text-orange-400">Compile Output:</div>
                    <pre className="bg-orange-900/20 p-2 rounded text-orange-300">
                      {submissionResult.compile_output}
                    </pre>
                  </div>
                )}
                {submissionResult.message && (
                  <div>
                    <div className="text-red-400">Message:</div>
                    <pre className="bg-red-900/20 p-2 rounded text-red-300">
                      {submissionResult.message}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
