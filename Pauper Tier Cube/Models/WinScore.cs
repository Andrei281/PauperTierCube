using System;
using System.Collections.Generic;

namespace Pauper_Tier_Cube.Models
{
    public partial class WinScore
    {
        public string? Name { get; set; }
        public string? Tier { get; set; }
        public string? Draftability { get; set; }
        public int? GamesWon { get; set; }
        public int? GamesPlayed { get; set; }
        public double? WinRatePercentage { get; set; }
    }
}
