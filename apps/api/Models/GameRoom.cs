using System.Collections.Generic;
using System.Linq;

namespace MyCsApi.Models
{
    public class GameRoom
    {
        public string RoomCode { get; }
        public string GameId { get; }
        private readonly List<Player> _players = new();
        public IReadOnlyCollection<Player> Players => _players.AsReadOnly();

        public GameRoom(string roomCode, string gameId)
        {
            RoomCode = roomCode;
            GameId = gameId;
        }

        public void AddPlayer(Player player)
        {
            if (!_players.Any(p => p.PlayerId == player.PlayerId))
            {
                _players.Add(player);
            }
        }

        public void RemovePlayer(Player player)
        {
            _players.RemoveAll(p => p.PlayerId == player.PlayerId);
        }
        public void RemovePlayer(string playerId)
        {
            _players.RemoveAll(p => p.PlayerId == playerId);
        }
    }
}
