using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyCsApi.Models
{
    public record BaseWebSocketMessage(string Type);

    public record CreateRoomClientPayload(string PlayerName);
    public record CreateRoomClientMessage(string Type, CreateRoomClientPayload Payload) : BaseWebSocketMessage(Type);

    public record JoinRoomClientPayload(string PlayerName, string RoomCode);
    public record JoinRoomClientMessage(string Type, JoinRoomClientPayload Payload) : BaseWebSocketMessage(Type);


    public record PlayerInfo(string Id, string Name);

    public record RoomCreatedServerPayload(string RoomCode, string PlayerId, string PlayerName, string GameId);
    public record RoomCreatedServerMessage(string Type, RoomCreatedServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public RoomCreatedServerMessage(string roomCode, string playerId, string playerName, string gameId)
            : this("roomCreated", new RoomCreatedServerPayload(roomCode, playerId, playerName, gameId)) { }
    }

    public record JoinSuccessServerPayload(string PlayerId, string PlayerName, string GameId, List<PlayerInfo> PlayersInLobby);
    public record JoinSuccessServerMessage(string Type, JoinSuccessServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public JoinSuccessServerMessage(string playerId, string playerName, string gameId, List<PlayerInfo> playersInLobby)
            : this("joinSuccess", new JoinSuccessServerPayload(playerId, playerName, gameId, playersInLobby)) { }
    }

    public record JoinFailedServerPayload(string Reason);
    public record JoinFailedServerMessage(string Type, JoinFailedServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public JoinFailedServerMessage(string reason) : this("joinFailed", new JoinFailedServerPayload(reason)) { }
    }

    public record PlayerJoinedLobbyServerPayload(string PlayerId, string PlayerName);
    public record PlayerJoinedLobbyServerMessage(string Type, PlayerJoinedLobbyServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public PlayerJoinedLobbyServerMessage(string playerId, string playerName)
            : this("playerJoinedLobby", new PlayerJoinedLobbyServerPayload(playerId, playerName)) { }
    }

    public record PlayerLeftLobbyServerPayload(string PlayerId, string PlayerName);
    public record PlayerLeftLobbyServerMessage(string Type, PlayerLeftLobbyServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public PlayerLeftLobbyServerMessage(string playerId, string playerName)
           : this("playerLeftLobby", new PlayerLeftLobbyServerPayload(playerId, playerName)) { }
    }
}
