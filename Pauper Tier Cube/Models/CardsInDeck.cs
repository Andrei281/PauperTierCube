using System;
using System.Collections.Generic;

namespace Pauper_Tier_Cube.Models
{
    public partial class CardsInDeck
    {
        public string? DeckId { get; set; }
        public string? Name { get; set; }
        public int? CopiesUsed { get; set; }
        public int? CopiesAvailable { get; set; }
    }
}
