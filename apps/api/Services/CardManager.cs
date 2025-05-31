using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using MyCsApi.Models;

namespace MyCsApi.Services;

public interface ICardManager
{
    public Task UseCardAsync(WebSocket webSocket, string playerId, string cardName, string targetPlayerId);
}

public class CardManager : ICardManager
{
    private readonly ILogger<CardManager> _logger;
    private readonly ConcurrentDictionary<string, Player> _players;

    public CardManager(ILogger<CardManager> logger, IRoomManager roomManager)
    {
        _logger = logger;
        _players = roomManager.GetPlayers();
    }

    public async Task UseCardAsync(WebSocket webSocket, string playerId, string cardName, string targetPlayerId)
    {
        switch (cardName)
        {
            case "Attack":
                await SendPlayerUpdateMessageAsync(webSocket, playerId, targetPlayerId, 20, cardName);
                break;
            case "SyntaxScramble":
                await SendSyntaxScrambleMessageAsync(webSocket, targetPlayerId, cardName);
                break;
        }
        
    }

    private async Task SendSyntaxScrambleMessageAsync(WebSocket webSocket, string targetPlayerId, string cardName)
    {
        if (webSocket.State == WebSocketState.Open)
        {
            var messageJson = $"{{\"playerId\": \"{targetPlayerId}\", \"cardName\": \"{cardName}\"}}";
            var bytes = Encoding.UTF8.GetBytes(messageJson);
            await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            _logger.LogDebug($"Sent message: {messageJson}");
        }
    }
    
    private async Task SendPlayerUpdateMessageAsync(WebSocket webSocket, string playerId, string targetPlayerId, int dHp, string cardName)
    {
        if (webSocket.State == WebSocketState.Open)
        {
            var messageJson = $"{{\"playerId\": \"{targetPlayerId}\", \"hp\": \"{dHp}\", \"cardName\": \"{cardName}\"}}";
            var bytes = Encoding.UTF8.GetBytes(messageJson);
            await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            _logger.LogDebug($"Sent message: {messageJson}");
        }
    }
}