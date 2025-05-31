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
    public class RoomManager
    {
        private readonly ConcurrentDictionary<string, GameRoom> _rooms = new();
        private readonly ConcurrentDictionary<string, Player> _players = new();
        private readonly ILogger<RoomManager> _logger;
        private static readonly JsonSerializerOptions _jsonSerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };


        public RoomManager(ILogger<RoomManager> logger)
        {
            _logger = logger;
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

        public async Task<ConcurrentDictionary<string, Player>> GetPlayerList(WebSocket webSocket, string playerId)
        {
            return _players;
        }
    }
}
