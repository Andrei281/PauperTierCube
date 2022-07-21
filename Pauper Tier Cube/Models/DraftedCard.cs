using System;
using System.Collections.Generic;

namespace Pauper_Tier_Cube.Models
{
    public partial class DraftedCard
    {
        public string Name { get; set; } = null!;
        public string Tier { get; set; } = null!;
        public int? DraftsPicked { get; set; }
        public string? PlayerName { get; set; }
        public string? Draftability { get; set; }

        public virtual CardsInCube CardsInCube { get; set; } = null!;
    }
}
