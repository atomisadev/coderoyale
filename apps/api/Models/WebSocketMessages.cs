using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MyCsApi.Models
{
    public record BaseWebSocketMessage(string Type);

    public record CreateRoomClientPayload(string PlayerName);
    public record CreateRoomClientMessage(string Type, CreateRoomClientPayload Payload) : BaseWebSocketMessage(Type);

    public record JoinRoomClientPayload(string PlayerName, string RoomCode);
    public record JoinRoomClientMessage(string Type, JoinRoomClientPayload Payload) : BaseWebSocketMessage(Type);

    public record StartGameClientPayload();
    public record StartGameClientMessage(string Type, StartGameClientPayload Payload) : BaseWebSocketMessage(Type)
    {
        public StartGameClientMessage() : this("startGame", new StartGameClientPayload()) { }
    }


    public record PlayerInfo(string Id, string Name);

    public record RoomCreatedServerPayload(string RoomCode, string PlayerId, string PlayerName, string GameId, string HostPlayerId);
    public record RoomCreatedServerMessage(string Type, RoomCreatedServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public RoomCreatedServerMessage(string roomCode, string playerId, string playerName, string gameId, string hostPlayerId)
            : this("roomCreated", new RoomCreatedServerPayload(roomCode, playerId, playerName, gameId, hostPlayerId)) { }
    }

    public record JoinSuccessServerPayload(string PlayerId, string PlayerName, string GameId, List<PlayerInfo> PlayersInLobby, string HostPlayerId);
    public record JoinSuccessServerMessage(string Type, JoinSuccessServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public JoinSuccessServerMessage(string playerId, string playerName, string gameId, List<PlayerInfo> playersInLobby, string hostPlayerId)
            : this("joinSuccess", new JoinSuccessServerPayload(playerId, playerName, gameId, playersInLobby, hostPlayerId)) { }
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

    public record GameStartedServerPayload(List<PlayerInfo> PlayersInGame);
    public record GameStartedServerMessage(string Type, GameStartedServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public GameStartedServerMessage(List<PlayerInfo> playersInGame)
            : this("gameStarted", new GameStartedServerPayload(playersInGame)) { }
    }

    
    public record UseCardPayload(string CardName, string PlayerId, string TargetPlayerId);

    public record UseCardMessage(string Type, UseCardPayload Payload) : BaseWebSocketMessage(Type)
    {
        public UseCardMessage(string cardName, string playerId, string targetPlayerId) 
            : this("useCard", new UseCardPayload(cardName, playerId, targetPlayerId)) { }
    }

    public record NewProblemPayload(string ProblemName, string ProblemInfo);

    public record NewProblemMessage(string Type, NewProblemPayload Payload) : BaseWebSocketMessage(Type)
    {
        public NewProblemMessage(string problemName, string problemInfo)
            : this("newProblem", new NewProblemPayload(problemName, problemInfo)) { }
    }

    public record PlayerStateUpdatePayload(string PlayerId, string[] cards);
    public record PlayerStateUpdateMessage(string Type, PlayerStateUpdatePayload Payload) : BaseWebSocketMessage(Type)
    {
        public PlayerStateUpdateMessage(string playerId, string[] cards)
            : this("playerStateUpdate", new PlayerStateUpdatePayload(playerId, cards)) { }
    }

    public record PlayerEliminatedPayload(string PlayerId, string PlayerName, string Reason);
    public record PlayerEliminatedMessage(string Type, PlayerEliminatedPayload Payload) : BaseWebSocketMessage(Type)
    {
        public PlayerEliminatedMessage(string playerId, string playerName, string reason)
            : this("playerEliminated", new PlayerEliminatedPayload(playerId, playerName, reason)) { }
    }

    public record GameOverPayload(string PlayerId, string PlayerName);
    public record GameOverMessage(string Type, GameOverPayload Payload) : BaseWebSocketMessage(Type)
    {
        public GameOverMessage(string playerId, string playerName)
            : this("gameOver", new GameOverPayload(playerId, playerName)) { }
    }

    public record StartGamePayload();

    public record StartGameMessage(string Type, StartGamePayload Payload) : BaseWebSocketMessage(Type)
    {
        public StartGameMessage() :
            this("startGame", new StartGamePayload())
        { }
    }
    
    public record PlayerSolvedPayload(string PlayerName, string PlayerId);

    public record PlayerSolvedMessage(string Type, PlayerSolvedPayload Payload) : BaseWebSocketMessage(Type)
    {
        public PlayerSolvedMessage(string playerName, string playerId)
            : this("playerSolved", new PlayerSolvedPayload(playerName, playerId)) { }
    }
}
