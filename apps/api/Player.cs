namespace MyCsApi;

public class Player
{
    public string Name { get; set; }
    public int Health { get; set; } = MaxHealth
    public static int MaxHealth { get; set; } = 100;
    private string Id { get; set; }
    private bool IsBot { get; set; }
    public Item[] Inventory { get; set; } = new Item[];
}