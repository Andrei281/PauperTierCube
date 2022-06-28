using System;
using System.Collections.Generic;

#nullable disable

namespace Pauper_Tier_Cube.Models
{
    public partial class DraftedCard
    {
        public string Name { get; set; }
        public string Tier { get; set; }
        public int? DraftsPicked { get; set; }
        public string PlayerName { get; set; }
        public string Draftability { get; set; }

        public virtual CardsInCube CardsInCube { get; set; }
    }
}
