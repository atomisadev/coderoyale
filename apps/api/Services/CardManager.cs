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
    
    private static readonly JsonSerializerOptions _jsonSerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task UseCardAsync(WebSocket webSocket, string playerId, string cardName, string targetPlayerId)
    {
        switch (cardName)
        {
            case "Attack":
                var stateMessage = new DamageMessage(playerId, targetPlayerId, 20, cardName);
                await SendMessageAsync(webSocket, stateMessage);
                break;
            case "SyntaxScramble":
                var scrambleMessage = new SyntaxScrambleMessage(playerId, targetPlayerId, cardName);
                await SendMessageAsync(webSocket, scrambleMessage);
                break;
            case "Casino":
                var casinoMessage = new DamageMessage(playerId, targetPlayerId, Random.Shared.Next(30), cardName);
                await SendMessageAsync(webSocket, casinoMessage);
                break;
            case "CompilerAttack":
                var compilerMessage = new CompilerAttackMessage(playerId, targetPlayerId, cardName);
                await SendMessageAsync(webSocket, compilerMessage);
                break;
            case "Leak":
                var leakMessage = new LeakMessage(playerId, targetPlayerId);
                await SendMessageAsync(webSocket, leakMessage);
                break;
            case "Defend":
                var defendMessage = new DefendMessage(playerId, 15, cardName);
                await SendMessageAsync(webSocket, defendMessage);
                break;
            case "Block":
                var blockMessage = new BlockMessage(playerId, cardName);
                await SendMessageAsync(webSocket, blockMessage);
                break;
            case "Heal":
                var healMessage = new HealMessage(playerId, 15, cardName);
                await SendMessageAsync(webSocket, healMessage);
                break;
            case "VibeCode":
                var vibeCodeMessage = new VibeCodeMessage(playerId, targetPlayerId, cardName);
                await SendMessageAsync(webSocket, vibeCodeMessage);
                break;
            
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
}