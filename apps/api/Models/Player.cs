using System.Net.WebSockets;

namespace MyCsApi.Models
{
    public class Player
    {
        public string PlayerId { get; }
        public string Name { get; set; }
        public WebSocket Socket { get; }
        public string CurrentRoomCode { get; set; }

        public Player(string playerId, string name, WebSocket socket, string roomCode)
        {
            PlayerId = playerId;
            Name = name;
            Socket = socket;
            CurrentRoomCode = roomCode;
        }
    }
}
