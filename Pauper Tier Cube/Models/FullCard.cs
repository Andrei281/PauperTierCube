using System;
using System.Collections.Generic;

namespace Pauper_Tier_Cube.Models
{
    public partial class FullCard
    {
        public string Name { get; set; } = null!;
        public string? ColorIdentity { get; set; }
        public int? Cmc { get; set; }
        public string? CombinedTypes { get; set; }
        public string? Tier { get; set; }
        public string? Draftability { get; set; }
        public double? WinRatePercentage { get; set; }
        public int? GamesPlayed { get; set; }
        public byte[]? Image { get; set; }
    }
}
