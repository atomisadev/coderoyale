using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MyCsApi.Models;

namespace MyCsApi.Services
{
    public interface IRoomManager
    {
        public Task CreateRoomAsync(WebSocket webSocket, string playerId, string playerName);
        public Task JoinRoomAsync(WebSocket webSocket, string playerId, string playerName, string roomCode);
        public Task StartGameAsync(string playerId);
        public Task PlayerDisconnectedAsync(string playerId, WebSocket webSocket);
        public ConcurrentDictionary<string, Player> GetPlayers();
    }
    public class RoomManager : IRoomManager
    {
        private readonly ConcurrentDictionary<string, GameRoom> _rooms = new();
        private readonly ConcurrentDictionary<string, Player> _players = new();
        private readonly ILogger<RoomManager> _logger;
        private readonly IProblemService _problemService;
        private readonly Dictionary<string, Timer> _problemTimers = new();
        private readonly Random _random = new();
        private static readonly JsonSerializerOptions _jsonSerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public RoomManager(ILogger<RoomManager> logger, IProblemService problemService)
        {
            _logger = logger;
            _problemService = problemService;
        }

        public ConcurrentDictionary<string, Player> GetPlayers()
        {
            return _players;
        }

        private string GenerateRoomCode()
        {
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 5)
              .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        public async Task CreateRoomAsync(WebSocket webSocket, string playerId, string playerName)
        {
            var roomCode = GenerateRoomCode();
            while (_rooms.ContainsKey(roomCode))
            {
                roomCode = GenerateRoomCode();
            }

            var gameId = Guid.NewGuid().ToString();
            var newPlayer = new Player(playerId, playerName, webSocket, roomCode);
            var room = new GameRoom(roomCode, gameId, playerId);
            room.AddPlayer(newPlayer);

            if (_rooms.TryAdd(roomCode, room) && _players.TryAdd(playerId, newPlayer))
            {
                _logger.LogInformation($"Room {roomCode} created by player {playerName} ({playerId}). GameID: {gameId}");
                var response = new RoomCreatedServerMessage(roomCode, playerId, playerName, gameId, playerId);
                await SendMessageAsync(webSocket, response);
            }
            else
            {
                _logger.LogError($"Failed to add room {roomCode} or player {playerId}.");
                await SendMessageAsync(webSocket, new JoinFailedServerMessage("Failed to create room. Please try again."));
            }
        }

        public async Task JoinRoomAsync(WebSocket webSocket, string playerId, string playerName, string roomCode)
        {
            if (!_rooms.TryGetValue(roomCode, out var room))
            {
                await SendMessageAsync(webSocket, new JoinFailedServerMessage("Room not found."));
                return;
            }

            if (room.Players.Count >= 10)
            {
                await SendMessageAsync(webSocket, new JoinFailedServerMessage("Room is full."));
                return;
            }

            if (room.Players.Any(p => p.PlayerId == playerId || p.Name.Equals(playerName, StringComparison.OrdinalIgnoreCase)))
            {
                await SendMessageAsync(webSocket, new JoinFailedServerMessage("Player ID or name already in room."));
                return;
            }

            var newPlayer = new Player(playerId, playerName, webSocket, roomCode);
            room.AddPlayer(newPlayer);

            if (!_players.TryAdd(playerId, newPlayer))
            {
                room.RemovePlayer(newPlayer);
                await SendMessageAsync(webSocket, new JoinFailedServerMessage("Failed to add player. Please try again."));
                _logger.LogError($"Failed to add player {playerId} to global player list for room {roomCode}.");
                return;
            }

            _logger.LogInformation($"Player {playerName} ({playerId}) joined room {roomCode}. GameID: {room.GameId}");

            var joinSuccessResponse = new JoinSuccessServerMessage(
                room.RoomCode,
                playerId,
                playerName,
                room.GameId,
                room.Players.Where(p => p.PlayerId != playerId).Select(p => new PlayerInfo(p.PlayerId, p.Name)).ToList(),
                room.HostPlayerId
            );
            await SendMessageAsync(webSocket, joinSuccessResponse);

            var playerJoinedLobbyMessage = new PlayerJoinedLobbyServerMessage(playerId, playerName);
            await BroadcastMessageToRoomAsync(roomCode, playerJoinedLobbyMessage, playerId);
        }

        public async Task StartGameAsync(string playerId)
        {
            if (!_players.TryGetValue(playerId, out var requestingPlayer))
            {
                _logger.LogWarning($"StartGameAsync: Player {playerId} not found.");
                return;
            }

            if (!_rooms.TryGetValue(requestingPlayer.CurrentRoomCode, out var room))
            {
                _logger.LogWarning($"StartGameAsync: Room {requestingPlayer.CurrentRoomCode} not found for player {playerId}.");
                await SendMessageAsync(requestingPlayer.Socket, new JoinFailedServerMessage("Room not found.")); // Or a more specific error
                return;
            }

            if (room.HostPlayerId != playerId)
            {
                _logger.LogWarning($"Player {playerId} attempted to start game in room {room.RoomCode} but is not the host.");
                await SendMessageAsync(requestingPlayer.Socket, new JoinFailedServerMessage("Only the host can start the game."));
                return;
            }

            if (room.GameState != "Lobby")
            {
                _logger.LogInformation($"Game in room {room.RoomCode} has already started or finished.");
                await SendMessageAsync(requestingPlayer.Socket, new JoinFailedServerMessage($"Game is already {room.GameState}."));
                return;
            }

            room.GameState = "InProgress";
            _logger.LogInformation($"Game started in room {room.RoomCode} by host {playerId}");

            var playersInGame = room.Players.Select(p => new PlayerInfo(p.PlayerId, p.Name)).ToList();
            var gameStartedMessage = new GameStartedServerMessage(playersInGame);
            await BroadcastMessageToRoomAsync(room.RoomCode, gameStartedMessage);

            var problem = _problemService.GetRandomProblem();
            if (problem != null && problem.LastVersion?.Data != null)
            {
                var problemData = problem.LastVersion.Data;
                var testCasesForMessage = problemData.TestCases ?? new List<ProblemTestCase>();
                var newProblemMessage = new NewProblemServerMessage(
                    problem.Title ?? "Untitled Problem", // Provide default if null
                    problemData.Statement ?? "No statement provided.", // Provide default if null
                    problemData.InputDescription ?? "No input description provided.", // Provide default if null
                    problemData.OutputDescription ?? "No output description provided.", // Provide default if null
                    problemData.Constraints, // This is handled by the constructor (constraints ?? string.Empty)
                    testCasesForMessage
                );
                await BroadcastMessageToRoomAsync(room.RoomCode, newProblemMessage);

                StartProblemTimer(room.RoomCode);

                _logger.LogInformation($"Sent problem '{problem.Title ?? "Untitled Problem"}' to room {room.RoomCode}");
            }
            else
            {
                _logger.LogWarning($"Could not retrieve a problem for room {room.RoomCode}. No problem will be sent.");
            }
        }

        private void StartProblemTimer(string roomCode)
        {
            if (_problemTimers.ContainsKey(roomCode))
            {
                _problemTimers[roomCode].Dispose();
                _problemTimers.Remove(roomCode);
            }

            var timer = new Timer(async _ => await HandleProblemTimeout(roomCode), null, TimeSpan.FromSeconds(10), Timeout.InfiniteTimeSpan);
            _problemTimers[roomCode] = timer;
        }

        private async Task HandleProblemTimeout(string roomCode)
        {
            if (!_rooms.TryGetValue(roomCode, out var room)) return;

            _logger.LogInformation($"Problem timeout in room {roomCode}");

            var timeoutMessage = new ProblemTimeoutMessage();
            await BroadcastMessageToRoomAsync(roomCode, timeoutMessage);

            foreach (var player in room.Players)
            {
                player.HP = Math.Max(0, player.HP - 30);

                var hpUpdateMessage = new
                {
                    type = "playerHpUpdate",
                    payload = new { playerId = player.PlayerId, hp = player.HP }
                };

                await BroadcastMessageToRoomAsync(roomCode, hpUpdateMessage);

                _logger.LogInformation($"Player {player.Name} lost 30 HP due to timeout, now has {player.HP} HP");

                // await SendMessageAsync(player.Socket, hpUpdateMessage);
            }

            await Task.Delay(2000);

            await StartNewProblem(roomCode);
        }

        public async Task HandlePlayerSolvedProblem(string playerId)
        {
            if (!_players.TryGetValue(playerId, out var player)) return;
            if (!_rooms.TryGetValue(player.CurrentRoomCode, out var room)) return;

            _logger.LogInformation($"Player {player.Name} solved problem in room {room.RoomCode}");

            if (_problemTimers.ContainsKey(room.RoomCode))
            {
                _problemTimers[room.RoomCode].Dispose();
                _problemTimers.Remove(room.RoomCode);
            }

            var card = GenerateRandomCard();
            _logger.LogInformation($"Player {player.Name} received card: {card.Name} ({card.Rarity})");

            var cardPayload = new { cardName = card.Name, rarity = card.Rarity, description = card.Description };
            var cardMessage = new { type = "cardAwarded", payload = cardPayload };
            await SendMessageAsync(player.Socket, cardMessage);

            await Task.Delay(1000);

            await StartNewProblem(room.RoomCode);
        }

        private async Task StartNewProblem(string roomCode)
        {
            if (!_rooms.TryGetValue(roomCode, out var room)) return;

            var problem = _problemService.GetRandomProblem();
            if (problem != null && problem.LastVersion?.Data != null)
            {
                var problemData = problem.LastVersion.Data;
                var testCasesForMessage = problemData.TestCases ?? new List<ProblemTestCase>();
                var newProblemMessage = new NewProblemServerMessage(
                    problem.Title ?? "Untitled Problem",
                    problemData.Statement ?? "No statement provided.",
                    problemData.InputDescription ?? "No input description provided.",
                    problemData.OutputDescription ?? "No output description provided.",
                    problemData.Constraints,
                    testCasesForMessage
                );
                await BroadcastMessageToRoomAsync(room.RoomCode, newProblemMessage);

                // Start new timer
                StartProblemTimer(room.RoomCode);

                _logger.LogInformation($"Started new problem '{problem.Title ?? "Untitled Problem"}' in room {room.RoomCode}");
            }
        }

        private Card GenerateRandomCard()
        {
            var rarityRoll = _random.NextDouble();
            var rarity = rarityRoll switch
            {
                <= 0.65 => "Common",
                <= 0.90 => "Uncommon",
                _ => "Rare"
            };

            var cards = GetCardsByRarity(rarity);
            var selectedCard = cards[_random.Next(cards.Length)];

            return new Card
            {
                Name = selectedCard.Name,
                Rarity = rarity,
                Description = selectedCard.Description
            };
        }
        private Card[] GetCardsByRarity(string rarity)
        {
            return rarity switch
            {
                "Common" => new[]
                {
                    new Card { Name = "Attack", Description = "Deal 20 damage to target player" },
                    new Card { Name = "A Trip to the Casino", Description = "Deal 0-30 random damage" },
                    new Card { Name = "Defend", Description = "Block next 15 damage received" },
                    new Card { Name = "Shield", Description = "Negate next power-up directed at you" }
                },
                "Uncommon" => new[]
                {
                    new Card { Name = "Compiler Attack", Description = "Prevent target from submitting for 10 seconds" },
                    new Card { Name = "Heal", Description = "Restore 15 HP" },
                    new Card { Name = "Leak", Description = "Reveal next problem type to all players" },
                    new Card { Name = "Vibe Coding", Description = "AI rewrites target's code badly" }
                },
                "Rare" => new[]
                {
                    new Card { Name = "Syntax Scramble", Description = "Replace target's code with random unicode temporarily" }
                },
                _ => new[] { new Card { Name = "Attack", Description = "Deal 20 damage" } }
            };
        }

        public async Task PlayerDisconnectedAsync(string playerId, WebSocket webSocket)
        {
            if (_players.TryRemove(playerId, out var player))
            {
                if (_rooms.TryGetValue(player.CurrentRoomCode, out var room))
                {
                    room.RemovePlayer(player);
                    _logger.LogInformation($"Player {player.Name} ({playerId}) disconnected from room {player.CurrentRoomCode}.");

                    var playerLeftMessage = new PlayerLeftLobbyServerMessage(playerId, player.Name);
                    await BroadcastMessageToRoomAsync(player.CurrentRoomCode, playerLeftMessage);

                    if (room.Players.Count == 0)
                    {
                        _rooms.TryRemove(room.RoomCode, out _);
                        _logger.LogInformation($"Room {room.RoomCode} is now empty and has been removed.");
                    }
                }
            }
        }


        private async Task SendMessageAsync(WebSocket webSocket, object message)
        {
            if (webSocket.State == WebSocketState.Open)
            {
                var messageJson = JsonSerializer.Serialize(message, _jsonSerializerOptions);
                var bytes = Encoding.UTF8.GetBytes(messageJson);
                await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
                _logger.LogDebug($"Sent message: {messageJson}");
            }
        }

        private async Task BroadcastMessageToRoomAsync(string roomCode, object message, string? excludePlayerId = null)
        {
            if (_rooms.TryGetValue(roomCode, out var room))
            {
                foreach (var player in room.Players)
                {
                    if (player.PlayerId != excludePlayerId)
                    {
                        await SendMessageAsync(player.Socket, message);
                    }
                }
            }
        }
    }

    public class Card
    {
        public string Name { get; set; } = string.Empty;
        public string Rarity { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
