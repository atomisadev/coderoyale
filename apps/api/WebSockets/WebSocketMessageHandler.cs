using System;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MyCsApi.Services;
using MyCsApi.Models;

namespace MyCsApi.WebSockets
{
    public class WebSocketMessageHandler
    {
        private readonly RoomManager _roomManager;
        private readonly CardManager _cardManager;
        private readonly ILogger<WebSocketMessageHandler> _logger;
        private static readonly JsonSerializerOptions _jsonSerializerOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public WebSocketMessageHandler(RoomManager roomManager, CardManager cardManager, ILogger<WebSocketMessageHandler> logger)
        {
            _roomManager = roomManager;
            _cardManager = cardManager;
            _logger = logger;
        }

        public async Task HandleWebSocketAsync(WebSocket webSocket)
        {
            var playerId = Guid.NewGuid().ToString();
            _logger.LogInformation($"WebSocket connection established: {playerId}");

            var buffer = new byte[1024 * 4];
            WebSocketReceiveResult result;

            try
            {
                do
                {
                    result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    if (result.MessageType == WebSocketMessageType.Text && !result.CloseStatus.HasValue)
                    {
                        var messageJson = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        _logger.LogInformation($"Received message from {playerId}: {messageJson}");

                        BaseWebSocketMessage? baseMessage = JsonSerializer.Deserialize<BaseWebSocketMessage>(messageJson, _jsonSerializerOptions);

                        if (baseMessage == null)
                        {
                            _logger.LogWarning($"Could not deserialize base message: {messageJson}");
                            continue;
                        }

                        switch (baseMessage.Type)
                        {
                            case "createRoom":
                                var createRoomMsg = JsonSerializer.Deserialize<CreateRoomClientMessage>(messageJson, _jsonSerializerOptions);
                                if (createRoomMsg != null)
                                    await _roomManager.CreateRoomAsync(webSocket, playerId, createRoomMsg.Payload.PlayerName);
                                break;
                            case "joinRoom":
                                var joinRoomMsg = JsonSerializer.Deserialize<JoinRoomClientMessage>(messageJson, _jsonSerializerOptions);
                                if (joinRoomMsg != null)
                                    await _roomManager.JoinRoomAsync(webSocket, playerId, joinRoomMsg.Payload.PlayerName, joinRoomMsg.Payload.RoomCode);
                                break;
                            case "useCard":
                                var useCardMsg = JsonSerializer.Deserialize<UseCardMessage>(messageJson, _jsonSerializerOptions);
                                if (useCardMsg != null)
                                    await _cardManager.UseCardAsync(webSocket, playerId, useCardMsg.Payload.CardName,
                                        useCardMsg.Payload.TargetPlayerId);
                                break;
                            case "startGame":
                                await _roomManager.StartGameAsync(playerId);
                                break;
                            default:
                                _logger.LogWarning($"Unknown message type from {playerId}: {baseMessage.Type}");
                                break;
                        }
                    }
                } while (!result.CloseStatus.HasValue);
            }
            catch (WebSocketException ex)
            {
                _logger.LogError($"WebSocketException for {playerId}: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception for {playerId}: {ex.Message}");
            }
            finally
            {
                await _roomManager.PlayerDisconnectedAsync(playerId, webSocket);
                if (webSocket.State != WebSocketState.Closed && webSocket.State != WebSocketState.Aborted)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Connection closed by server", CancellationToken.None);
                }
                _logger.LogInformation($"WebSocket connection closed for player {playerId}");
            }
        }
    }
}
