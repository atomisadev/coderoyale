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

    public record JoinSuccessServerPayload(string RoomCode, string PlayerId, string PlayerName, string GameId, List<PlayerInfo> PlayersInLobby, string HostPlayerId);
    public record JoinSuccessServerMessage(string Type, JoinSuccessServerPayload Payload) : BaseWebSocketMessage(Type)
    {
        public JoinSuccessServerMessage(string roomCode, string playerId, string playerName, string gameId, List<PlayerInfo> playersInLobby, string hostPlayerId)
            : this("joinSuccess", new JoinSuccessServerPayload(roomCode, playerId, playerName, gameId, playersInLobby, hostPlayerId)) { }
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

    public record PlayerStateUpdatePayload(string PlayerId, int Hp, string CardName);
    public record PlayerStateUpdateMessage(string Type, PlayerStateUpdatePayload Payload) : BaseWebSocketMessage(Type)
    {
        public PlayerStateUpdateMessage(string playerId, int hp, string cardName)
            : this("playerStateUpdate", new PlayerStateUpdatePayload(playerId, hp, cardName)) { }
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

    public record ProblemDetailsPayload(string Title, string Statement, string InputDescription, string OutputDescription, string? Constraints, List<ProblemTestCase> TestCases);

    public record NewProblemServerMessage(string Type, ProblemDetailsPayload Payload) : BaseWebSocketMessage(Type)
    {
        public NewProblemServerMessage(string title, string statement, string inputDesc, string outputDesc, string constraints, List<ProblemTestCase> testCases)
            : this("newProblem", new ProblemDetailsPayload(title, statement, inputDesc, outputDesc, constraints ?? string.Empty, testCases)) { }
    }

    public record SyntaxScramblePayload(string PlayerId, string TargetPlayerId, string CardName);

    public record SyntaxScrambleMessage(string Type, SyntaxScramblePayload Payload) : BaseWebSocketMessage(Type)
    {
        public SyntaxScrambleMessage(string playerId, string targetPlayerId, string cardName)
            : this("SyntaxScramble", new SyntaxScramblePayload(playerId, targetPlayerId, cardName)) { }
    }

    public record DamagePayload(string PlayerId, string TargetPlayerId, int Damage, string CardName);

    public record DamageMessage(string Type, DamagePayload Payload) : BaseWebSocketMessage(Type)
    {
        public DamageMessage(string playerId, string targetPlayerId, int damage, string cardName)
            : this("Damage", new DamagePayload(playerId, targetPlayerId, damage, cardName)) { }
    }

    public record DefendPayload(string PlayerId, int Defend, string CardName);

    public record DefendMessage(string Type, DefendPayload Payload) : BaseWebSocketMessage(Type)
    {
        public DefendMessage(string playerId, int defense, string cardName)
            : this("Defend", new DefendPayload(playerId, defense, cardName)) { }
    }

    public record BlockPayload(string PlayerId, string CardName);

    public record BlockMessage(string Type, BlockPayload Payload) : BaseWebSocketMessage(Type)
    {
        public BlockMessage(string playerId, string cardName)
            : this("Block", new BlockPayload(playerId, cardName)) { }
    }

    public record HealPayload(string PlayerId, int Hp, string CardName);

    public record HealMessage(string Type, HealPayload Payload) : BaseWebSocketMessage(Type)
    {
        public HealMessage(string playerId, int hp, string cardName)
            : this("Heal", new HealPayload(playerId, hp, cardName)) { }
    }

    public record VibeCodePayload(string PlayerId, string TargetPlayerId, string CardName);

    public record VibeCodeMessage(string Type, VibeCodePayload Payload) : BaseWebSocketMessage(Type)
    {
        public VibeCodeMessage(string playerId, string targetPlayerId, string cardName)
            : this("VibeCode", new VibeCodePayload(playerId, targetPlayerId, cardName)) { }
    }

    public record CompilerAttackPayload(string PlayerId, string TargetPlayerId, string CardName);

    public record CompilerAttackMessage(string Type, CompilerAttackPayload Payload) : BaseWebSocketMessage(Type)
    {
        public CompilerAttackMessage(string playerId, string targetPlayerId, string cardName)
            : this("compilerAttack", new CompilerAttackPayload(playerId, targetPlayerId, cardName)) { }
    }

    public record LeakPayload(string PlayerId, string CardName);

    public record LeakMessage(string Type, LeakPayload Payload) : BaseWebSocketMessage(Type)
    {
        public LeakMessage(string playerId, string cardName)
            : this("leak", new LeakPayload(playerId, cardName)) { }
    }
}
