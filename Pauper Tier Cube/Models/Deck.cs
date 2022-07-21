using System;
using System.Collections.Generic;

namespace Pauper_Tier_Cube.Models
{
    public partial class Deck
    {
        public string? PlayerName { get; set; }
        public string? Strat { get; set; }
        public string DeckId { get; set; } = null!;
        public DateTime? DatePlayed { get; set; }
        public int? GamesWon { get; set; }
        public int? GamesLost { get; set; }
        public decimal? LandsPerNonland { get; set; }
        public int? ColorCount { get; set; }
        public int? PlainsCount { get; set; }
        public int? IslandCount { get; set; }
        public int? SwampCount { get; set; }
        public int? MountainCount { get; set; }
        public int? ForestCount { get; set; }
        public bool? HallOfFame { get; set; }
        public string? Colors { get; set; }
        public string? DraftingFormat { get; set; }
    }
}
